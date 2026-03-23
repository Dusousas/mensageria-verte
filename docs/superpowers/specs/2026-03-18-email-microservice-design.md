# Email Microservice — Design Spec

**Date:** 2026-03-18
**Status:** Approved

---

## Overview

A Node.js microservice responsible for sending transactional emails (purchase confirmations, password resets, welcome messages, etc.) via a REST API. The service receives email requests from other services, renders an HTML template, and delivers via SMTP using Nodemailer.

---

## Stack

| Concern         | Choice                          |
|-----------------|---------------------------------|
| Runtime         | Node.js                         |
| Framework       | Express                         |
| Email transport | Nodemailer                      |
| Templates       | Handlebars (`.hbs`) via `nodemailer-express-handlebars` |
| Validation      | `express-validator`             |
| Config          | `dotenv`                        |
| Auth            | API Key (`x-api-key` header)    |

---

## Architecture

```
POST /api/emails
       │
  [API Key Middleware]
       │
  [Email Controller]
       │
  [Email Service]  ──►  [Template Engine (Handlebars)]
       │
  [Nodemailer / SMTP]
```

### Directory Structure

```
src/
  routes/        → endpoint definitions
  controllers/   → request/response handling
  services/      → Nodemailer send logic
  templates/     → .hbs files per email type
  middlewares/   → API Key validation
config/          → environment variable loading
.env             → secrets (never committed)
```

---

## API

### Endpoint

```
POST /api/emails
```

### Headers

```
x-api-key: <secret_key>
Content-Type: application/json
```

### Request Body

```json
{
  "type": "confirmation",
  "to": "customer@email.com",
  "subject": "Order confirmed!",
  "data": {
    "name": "João",
    "orderId": "12345",
    "total": "R$ 199,90"
  }
}
```

| Field     | Type   | Required | Description                                      |
|-----------|--------|----------|--------------------------------------------------|
| `type`    | string | yes      | Template name — must match a `.hbs` file         |
| `to`      | string | yes      | Recipient email address                          |
| `subject` | string | yes      | Email subject line                               |
| `data`    | object | yes      | Variables injected into the template             |

### Responses

| Status | Body                                      | When                          |
|--------|-------------------------------------------|-------------------------------|
| 200    | `{ "message": "Email enviado com sucesso" }` | Email sent successfully    |
| 400    | `{ "error": "<description>" }`            | Missing/invalid fields or unknown type |
| 401    | `{ "error": "API Key inválida" }`         | Missing or wrong API Key      |
| 500    | `{ "error": "Falha ao enviar email" }`    | SMTP/transport failure        |

---

## Email Types (Initial)

| Type             | Template file              | Expected `data` fields                  |
|------------------|----------------------------|-----------------------------------------|
| `confirmation`   | `confirmation.hbs`         | `name`, `orderId`, `total`              |
| `password-reset` | `password-reset.hbs`       | `name`, `resetLink`                     |
| `welcome`        | `welcome.hbs`              | `name`                                  |

New types are added by creating a new `.hbs` file — no code changes required.

---

## Security

- All routes under `/api/emails` require the `x-api-key` header
- API Key is compared against `process.env.API_KEY`
- `.env` is excluded from version control via `.gitignore`
- Email address format is validated before attempting to send

---

## Environment Variables

```env
# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu@email.com
SMTP_PASS=sua_senha_ou_app_password
SMTP_FROM_NAME=Minha Loja
SMTP_FROM_EMAIL=noreply@minhaloja.com

# API
API_KEY=chave_secreta_gerada
PORT=3000
```

---

## Error Handling

- Unknown `type` → 400 with `"Template '<type>' não encontrado"`
- Invalid email format in `to` → 400
- SMTP failure → 500, error logged server-side, generic message returned to caller
- Missing required fields → 400 with field-level error messages from `express-validator`

---

## Out of Scope (for now)

- Queue / retry mechanism (can be added later with BullMQ + Redis)
- Email tracking / open rates
- Multiple recipients (`cc`, `bcc`)
- Attachment support
- Template management UI
