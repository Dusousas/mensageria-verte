# Email Microservice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Node.js REST microservice that receives email requests and delivers them via SMTP using Nodemailer and Handlebars templates.

**Architecture:** A single Express app with one POST endpoint (`/api/emails`). An API Key middleware guards the route. The controller validates the request body, then delegates to the email service which selects the correct Handlebars template and sends via Nodemailer SMTP transport.

**Tech Stack:** Node.js, Express, Nodemailer, nodemailer-express-handlebars, express-validator, dotenv, Jest, Supertest

---

## File Map

| File | Responsibility |
|------|---------------|
| `package.json` | Dependencies, scripts, Jest config |
| `.gitignore` | Exclude `node_modules/`, `.env` |
| `.env.example` | Document all required env vars |
| `config/env.js` | Load and export validated env vars |
| `src/middlewares/apiKey.js` | Validate `x-api-key` header → 401 if missing/wrong |
| `src/services/emailService.js` | Create Nodemailer transport, resolve template, send email |
| `src/controllers/emailController.js` | Validate body fields, call email service, return response |
| `src/routes/emailRoutes.js` | Mount middleware + controller on `POST /api/emails` |
| `src/app.js` | Create and configure Express app (no `listen`) |
| `server.js` | Call `app.listen()` — entry point only |
| `src/templates/confirmation.hbs` | HTML template for purchase confirmation |
| `src/templates/password-reset.hbs` | HTML template for password reset |
| `src/templates/welcome.hbs` | HTML template for welcome message |
| `tests/config/env.test.js` | Unit tests for config validation |
| `tests/middlewares/apiKey.test.js` | Unit tests for API Key middleware |
| `tests/services/emailService.test.js` | Unit tests for email service (mocked Nodemailer) |
| `tests/controllers/emailController.test.js` | Unit tests for controller logic |
| `tests/routes/emails.test.js` | Integration tests for POST /api/emails |

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Initialize project**

```bash
npm init -y
```

- [ ] **Step 2: Install production dependencies**

```bash
npm install express nodemailer nodemailer-express-handlebars express-validator dotenv
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install --save-dev jest supertest nodemon
```

- [ ] **Step 4: Configure scripts and Jest in package.json**

Edit `package.json` — replace the `"scripts"` block and add `"jest"` config:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest --runInBand"
  },
  "jest": {
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
.env
```

- [ ] **Step 6: Create .env.example**

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

- [ ] **Step 7: Create .env from example**

```bash
cp .env.example .env
```

Fill in real SMTP credentials in `.env`.

- [ ] **Step 8: Commit**

```bash
git init
git add package.json package-lock.json .gitignore .env.example
git commit -m "chore: project setup with dependencies"
```

---

## Task 2: Environment Config

**Files:**
- Create: `config/env.js`
- Create: `tests/config/env.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/config/env.test.js
test('throws when a required environment variable is missing', () => {
  const saved = process.env.API_KEY;
  delete process.env.API_KEY;
  jest.resetModules();
  expect(() => require('../../config/env')).toThrow(
    'Missing required environment variable: API_KEY'
  );
  process.env.API_KEY = saved;
  jest.resetModules();
});

test('exports smtp and apiKey when all vars are set', () => {
  process.env.SMTP_HOST = 'smtp.test.com';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'u';
  process.env.SMTP_PASS = 'p';
  process.env.SMTP_FROM_NAME = 'Test';
  process.env.SMTP_FROM_EMAIL = 'test@test.com';
  process.env.API_KEY = 'key';
  jest.resetModules();

  const config = require('../../config/env');

  expect(config.smtp.host).toBe('smtp.test.com');
  expect(config.smtp.port).toBe(587);
  expect(config.apiKey).toBe('key');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/config/env.test.js --verbose
```

Expected: FAIL — `Cannot find module '../../config/env'`

- [ ] **Step 3: Create config/env.js**

```js
// config/env.js
require('dotenv').config();

const required = [
  'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS',
  'SMTP_FROM_NAME', 'SMTP_FROM_EMAIL', 'API_KEY'
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    fromName: process.env.SMTP_FROM_NAME,
    fromEmail: process.env.SMTP_FROM_EMAIL,
  },
  apiKey: process.env.API_KEY,
  port: Number(process.env.PORT) || 3000,
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/config/env.test.js --verbose
```

Expected: 2 tests PASS

- [ ] **Step 5: Commit**

```bash
git add config/env.js tests/config/env.test.js
git commit -m "feat: environment config loader with validation"
```

---

## Task 3: API Key Middleware

**Files:**
- Create: `src/middlewares/apiKey.js`
- Create: `tests/middlewares/apiKey.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// tests/middlewares/apiKey.test.js

// Set required env vars before requiring config
process.env.SMTP_HOST = 'host';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'user';
process.env.SMTP_PASS = 'pass';
process.env.SMTP_FROM_NAME = 'Test';
process.env.SMTP_FROM_EMAIL = 'test@test.com';
process.env.API_KEY = 'test-key';

const apiKeyMiddleware = require('../../src/middlewares/apiKey');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

test('passes when x-api-key header matches', () => {
  const req = { headers: { 'x-api-key': 'test-key' } };
  const res = mockRes();
  const next = jest.fn();

  apiKeyMiddleware(req, res, next);

  expect(next).toHaveBeenCalled();
  expect(res.status).not.toHaveBeenCalled();
});

test('returns 401 when x-api-key header is missing', () => {
  const req = { headers: {} };
  const res = mockRes();
  const next = jest.fn();

  apiKeyMiddleware(req, res, next);

  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith({ error: 'API Key inválida' });
  expect(next).not.toHaveBeenCalled();
});

test('returns 401 when x-api-key header is wrong', () => {
  const req = { headers: { 'x-api-key': 'wrong-key' } };
  const res = mockRes();
  const next = jest.fn();

  apiKeyMiddleware(req, res, next);

  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith({ error: 'API Key inválida' });
  expect(next).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/middlewares/apiKey.test.js --verbose
```

Expected: FAIL — `Cannot find module '../../src/middlewares/apiKey'`

- [ ] **Step 3: Implement the middleware**

```js
// src/middlewares/apiKey.js
const { apiKey } = require('../../config/env');

function apiKeyMiddleware(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== apiKey) {
    return res.status(401).json({ error: 'API Key inválida' });
  }
  next();
}

module.exports = apiKeyMiddleware;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/middlewares/apiKey.test.js --verbose
```

Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/middlewares/apiKey.js tests/middlewares/apiKey.test.js
git commit -m "feat: API Key authentication middleware"
```

---

## Task 4: Email Service

**Files:**
- Create: `src/services/emailService.js`
- Create: `tests/services/emailService.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// tests/services/emailService.test.js
jest.mock('nodemailer');
jest.mock('nodemailer-express-handlebars');

const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');

process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'user@test.com';
process.env.SMTP_PASS = 'pass';
process.env.SMTP_FROM_NAME = 'Test';
process.env.SMTP_FROM_EMAIL = 'test@test.com';
process.env.API_KEY = 'key';

const mockSendMail = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  hbs.mockReturnValue(jest.fn());
  nodemailer.createTransport.mockReturnValue({
    use: jest.fn(),
    sendMail: mockSendMail,
  });
});

const { sendEmail } = require('../../src/services/emailService');

test('calls sendMail with correct options', async () => {
  mockSendMail.mockResolvedValue({ messageId: 'abc123' });

  await sendEmail({
    type: 'welcome',
    to: 'user@email.com',
    subject: 'Bem-vindo!',
    data: { name: 'João' },
  });

  expect(mockSendMail).toHaveBeenCalledWith(
    expect.objectContaining({
      from: '"Test" <test@test.com>',
      to: 'user@email.com',
      subject: 'Bem-vindo!',
      template: 'welcome',
      context: { name: 'João' },
    })
  );
});

test('throws error when sendMail fails', async () => {
  mockSendMail.mockRejectedValue(new Error('SMTP error'));

  await expect(
    sendEmail({
      type: 'welcome',
      to: 'user@email.com',
      subject: 'Bem-vindo!',
      data: { name: 'João' },
    })
  ).rejects.toThrow('SMTP error');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/services/emailService.test.js --verbose
```

Expected: FAIL — `Cannot find module '../../src/services/emailService'`

- [ ] **Step 3: Implement the email service**

```js
// src/services/emailService.js
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');
const { smtp } = require('../../config/env');

const transporter = nodemailer.createTransport({
  host: smtp.host,
  port: smtp.port,
  auth: {
    user: smtp.user,
    pass: smtp.pass,
  },
});

transporter.use(
  'compile',
  hbs({
    viewEngine: {
      extname: '.hbs',
      layoutsDir: path.resolve(__dirname, '../templates'),
      defaultLayout: false,
    },
    viewPath: path.resolve(__dirname, '../templates'),
    extName: '.hbs',
  })
);

async function sendEmail({ type, to, subject, data }) {
  await transporter.sendMail({
    from: `"${smtp.fromName}" <${smtp.fromEmail}>`,
    to,
    subject,
    template: type,
    context: data,
  });
}

module.exports = { sendEmail };
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/services/emailService.test.js --verbose
```

Expected: 2 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/emailService.js tests/services/emailService.test.js
git commit -m "feat: email service with Nodemailer and Handlebars"
```

---

## Task 5: HTML Templates

**Files:**
- Create: `src/templates/confirmation.hbs`
- Create: `src/templates/password-reset.hbs`
- Create: `src/templates/welcome.hbs`

- [ ] **Step 1: Create confirmation.hbs**

```hbs
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; padding: 32px; }
    h1 { color: #333; }
    .order-info { background: #f9f9f9; border-radius: 6px; padding: 16px; margin: 24px 0; }
    .total { font-size: 1.2rem; font-weight: bold; color: #2a7ae2; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Pedido Confirmado!</h1>
    <p>Olá, <strong>{{name}}</strong>! Seu pedido foi recebido com sucesso.</p>
    <div class="order-info">
      <p>Número do pedido: <strong>{{orderId}}</strong></p>
      <p class="total">Total: {{total}}</p>
    </div>
    <p>Obrigado por comprar conosco!</p>
  </div>
</body>
</html>
```

- [ ] **Step 2: Create password-reset.hbs**

```hbs
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; padding: 32px; }
    h1 { color: #333; }
    .btn { display: inline-block; background: #2a7ae2; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin: 24px 0; font-size: 1rem; }
    .warning { color: #888; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Recuperação de Senha</h1>
    <p>Olá, <strong>{{name}}</strong>! Recebemos uma solicitação para redefinir sua senha.</p>
    <a href="{{resetLink}}" class="btn">Redefinir Senha</a>
    <p class="warning">Este link expira em 1 hora. Se você não solicitou isso, ignore este email.</p>
  </div>
</body>
</html>
```

- [ ] **Step 3: Create welcome.hbs**

```hbs
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; padding: 32px; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Bem-vindo!</h1>
    <p>Olá, <strong>{{name}}</strong>! Estamos muito felizes em ter você aqui.</p>
    <p>Sua conta foi criada com sucesso. Aproveite!</p>
  </div>
</body>
</html>
```

- [ ] **Step 4: Run full test suite to confirm green**

```bash
npm test
```

Expected: All tests from Tasks 2, 3, 4 PASS

- [ ] **Step 5: Commit**

```bash
git add src/templates/
git commit -m "feat: HTML email templates (confirmation, password-reset, welcome)"
```

---

## Task 6: Controller

**Files:**
- Create: `src/controllers/emailController.js`
- Create: `tests/controllers/emailController.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// tests/controllers/emailController.test.js
jest.mock('../../src/services/emailService');
jest.mock('fs');

const fs = require('fs');
const { sendEmail } = require('../../src/services/emailService');

process.env.SMTP_HOST = 'host';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'user';
process.env.SMTP_PASS = 'pass';
process.env.SMTP_FROM_NAME = 'Test';
process.env.SMTP_FROM_EMAIL = 'test@test.com';
process.env.API_KEY = 'key';

const { sendEmailHandler } = require('../../src/controllers/emailController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Simulate express-validator's validationResult
jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
  body: jest.fn(() => jest.fn()),
}));

const { validationResult } = require('express-validator');

beforeEach(() => {
  jest.clearAllMocks();
  // Default: no validation errors
  validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
});

test('returns 400 when validation errors exist', async () => {
  validationResult.mockReturnValue({
    isEmpty: () => false,
    array: () => [{ msg: "Campo 'to' deve ser um email válido" }],
  });
  const req = { body: {} };
  const res = mockRes();

  await sendEmailHandler(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ error: "Campo 'to' deve ser um email válido" });
});

test('returns 400 when template does not exist', async () => {
  fs.existsSync.mockReturnValue(false);
  const req = { body: { type: 'nonexistent', to: 'a@b.com', subject: 'Hi', data: {} } };
  const res = mockRes();

  await sendEmailHandler(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ error: "Template 'nonexistent' não encontrado" });
});

test('returns 200 when email is sent successfully', async () => {
  fs.existsSync.mockReturnValue(true);
  sendEmail.mockResolvedValue();
  const req = { body: { type: 'welcome', to: 'u@e.com', subject: 'Hi', data: { name: 'João' } } };
  const res = mockRes();

  await sendEmailHandler(req, res);

  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith({ message: 'Email enviado com sucesso' });
});

test('returns 500 when sendEmail throws', async () => {
  fs.existsSync.mockReturnValue(true);
  sendEmail.mockRejectedValue(new Error('SMTP down'));
  const req = { body: { type: 'welcome', to: 'u@e.com', subject: 'Hi', data: {} } };
  const res = mockRes();

  await sendEmailHandler(req, res);

  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith({ error: 'Falha ao enviar email' });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/controllers/emailController.test.js --verbose
```

Expected: FAIL — `Cannot find module '../../src/controllers/emailController'`

- [ ] **Step 3: Implement the controller**

```js
// src/controllers/emailController.js
const { validationResult } = require('express-validator');
const { sendEmail } = require('../services/emailService');
const path = require('path');
const fs = require('fs');

const TEMPLATES_DIR = path.resolve(__dirname, '../templates');

function templateExists(type) {
  return fs.existsSync(path.join(TEMPLATES_DIR, `${type}.hbs`));
}

async function sendEmailHandler(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { type, to, subject, data } = req.body;

  if (!templateExists(type)) {
    return res.status(400).json({ error: `Template '${type}' não encontrado` });
  }

  try {
    await sendEmail({ type, to, subject, data });
    return res.status(200).json({ message: 'Email enviado com sucesso' });
  } catch (err) {
    console.error('Email send error:', err);
    return res.status(500).json({ error: 'Falha ao enviar email' });
  }
}

module.exports = { sendEmailHandler };
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/controllers/emailController.test.js --verbose
```

Expected: 4 tests PASS

- [ ] **Step 5: Create the routes file**

```js
// src/routes/emailRoutes.js
const { Router } = require('express');
const { body } = require('express-validator');
const apiKeyMiddleware = require('../middlewares/apiKey');
const { sendEmailHandler } = require('../controllers/emailController');

const router = Router();

const validateBody = [
  body('type').notEmpty().withMessage("Campo 'type' obrigatório"),
  body('to').isEmail().withMessage("Campo 'to' deve ser um email válido"),
  body('subject').notEmpty().withMessage("Campo 'subject' obrigatório"),
  body('data').isObject().withMessage("Campo 'data' deve ser um objeto"),
];

router.post('/', apiKeyMiddleware, validateBody, sendEmailHandler);

module.exports = router;
```

- [ ] **Step 6: Run full test suite**

```bash
npm test
```

Expected: All tests from Tasks 2, 3, 4, 6 PASS

- [ ] **Step 7: Commit**

```bash
git add src/controllers/emailController.js src/routes/emailRoutes.js tests/controllers/emailController.test.js
git commit -m "feat: email controller, validation and routes"
```

---

## Task 7: Express App and Server Entry Point

**Files:**
- Create: `src/app.js`
- Create: `server.js`

- [ ] **Step 1: Create src/app.js**

```js
// src/app.js
const express = require('express');
const emailRoutes = require('./routes/emailRoutes');

const app = express();

app.use(express.json());
app.use('/api/emails', emailRoutes);

module.exports = app;
```

- [ ] **Step 2: Create server.js**

```js
// server.js
const app = require('./src/app');
const { port } = require('./config/env');

app.listen(port, () => {
  console.log(`Email service running on port ${port}`);
});
```

- [ ] **Step 3: Run full test suite to confirm nothing regressed**

```bash
npm test
```

Expected: All tests from Tasks 2, 3, 4, 6 PASS

- [ ] **Step 4: Commit**

```bash
git add src/app.js server.js
git commit -m "feat: Express app and server entry point"
```

---

## Task 8: Integration Tests

**Files:**
- Create: `tests/routes/emails.test.js`

- [ ] **Step 1: Write the integration tests**

```js
// tests/routes/emails.test.js
jest.mock('../../src/services/emailService');
jest.mock('fs');

const fs = require('fs');
const request = require('supertest');

process.env.API_KEY = 'integration-test-key';
process.env.SMTP_HOST = 'host';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'user';
process.env.SMTP_PASS = 'pass';
process.env.SMTP_FROM_NAME = 'Test';
process.env.SMTP_FROM_EMAIL = 'test@test.com';

const app = require('../../src/app');
const { sendEmail } = require('../../src/services/emailService');

const VALID_HEADERS = { 'x-api-key': 'integration-test-key' };

beforeEach(() => {
  jest.clearAllMocks();
  // Default: template files exist on disk
  fs.existsSync.mockReturnValue(true);
});

test('POST /api/emails - 401 without API key', async () => {
  const res = await request(app).post('/api/emails').send({});
  expect(res.status).toBe(401);
  expect(res.body).toEqual({ error: 'API Key inválida' });
});

test('POST /api/emails - 400 when required fields are missing', async () => {
  const res = await request(app)
    .post('/api/emails')
    .set(VALID_HEADERS)
    .send({ type: 'welcome' });
  expect(res.status).toBe(400);
});

test('POST /api/emails - 400 when to is not a valid email', async () => {
  const res = await request(app)
    .post('/api/emails')
    .set(VALID_HEADERS)
    .send({ type: 'welcome', to: 'not-an-email', subject: 'Hi', data: {} });
  expect(res.status).toBe(400);
});

test('POST /api/emails - 400 when template type does not exist', async () => {
  fs.existsSync.mockReturnValue(false);
  const res = await request(app)
    .post('/api/emails')
    .set(VALID_HEADERS)
    .send({ type: 'nonexistent', to: 'a@b.com', subject: 'Hi', data: {} });
  expect(res.status).toBe(400);
  expect(res.body.error).toMatch(/não encontrado/);
});

test('POST /api/emails - 200 on successful send', async () => {
  sendEmail.mockResolvedValue();
  const res = await request(app)
    .post('/api/emails')
    .set(VALID_HEADERS)
    .send({ type: 'welcome', to: 'user@email.com', subject: 'Bem-vindo!', data: { name: 'João' } });
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ message: 'Email enviado com sucesso' });
  expect(sendEmail).toHaveBeenCalledWith({
    type: 'welcome',
    to: 'user@email.com',
    subject: 'Bem-vindo!',
    data: { name: 'João' },
  });
});

test('POST /api/emails - 500 when sendEmail throws', async () => {
  sendEmail.mockRejectedValue(new Error('SMTP down'));
  const res = await request(app)
    .post('/api/emails')
    .set(VALID_HEADERS)
    .send({ type: 'welcome', to: 'user@email.com', subject: 'Hi', data: { name: 'João' } });
  expect(res.status).toBe(500);
  expect(res.body).toEqual({ error: 'Falha ao enviar email' });
});
```

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: All tests PASS (Tasks 2, 3, 4, 6, 8)

- [ ] **Step 3: Commit**

```bash
git add tests/routes/emails.test.js
git commit -m "test: integration tests for POST /api/emails"
```

---

## Task 9: Manual Smoke Test

- [ ] **Step 1: Start the server**

```bash
npm run dev
```

Expected: `Email service running on port 3000`

- [ ] **Step 2: Test 401 without key**

```bash
curl -s -X POST http://localhost:3000/api/emails \
  -H "Content-Type: application/json" \
  -d '{"type":"welcome","to":"test@test.com","subject":"Hi","data":{"name":"Test"}}' | cat
```

Expected: `{"error":"API Key inválida"}`

- [ ] **Step 3: Test 200 with valid key**

Replace `YOUR_API_KEY` with the value from `.env`:

```bash
curl -s -X POST http://localhost:3000/api/emails \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"type":"welcome","to":"your@real-email.com","subject":"Bem-vindo!","data":{"name":"João"}}' | cat
```

Expected: `{"message":"Email enviado com sucesso"}` and email received in inbox.

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "chore: final project state — email microservice complete"
```

---

## Adding New Email Types Later

1. Create `src/templates/<new-type>.hbs` with the desired HTML and `{{variable}}` placeholders
2. Send a POST request with `"type": "<new-type>"` and the matching `data` fields in `data`
3. No code changes required
