# Templates HBS de Email

Templates inspirados na identidade visual do frontend deste projeto:

- Verde escuro: `#163b34`
- Verde principal: `#2a5654`
- Bege de fundo: `#faf3e8`
- Texto principal: `#212529`

## Estrutura

- `partials/header.hbs`
- `partials/footer.hbs`
- `welcome.hbs`
- `reset-password.hbs`
- `password-reset-success.hbs`
- `purchase-confirmed.hbs`

## Variaveis por template

### Base (comum)

- `appName`
- `supportEmail`

### welcome.hbs

- `name`
- `loginUrl`

### reset-password.hbs

- `name`
- `resetUrl`
- `expiresIn` (opcional, ex: "60 minutos")

### password-reset-success.hbs

- `name`
- `loginUrl` (opcional)

### purchase-confirmed.hbs

- `name`
- `orderId`
- `amount`
- `paymentMethod`
- `orderUrl` (opcional)
- `items` (opcional, array):
  - `description`
  - `quantity`
  - `price`

## Exemplo de registro de partials (Node + Handlebars)

```js
import fs from "node:fs";
import path from "node:path";
import Handlebars from "handlebars";

const basePath = path.resolve("email-templates/hbs");
const header = fs.readFileSync(path.join(basePath, "partials/header.hbs"), "utf8");
const footer = fs.readFileSync(path.join(basePath, "partials/footer.hbs"), "utf8");

Handlebars.registerPartial("header", header);
Handlebars.registerPartial("footer", footer);

const templateSource = fs.readFileSync(path.join(basePath, "reset-password.hbs"), "utf8");
const template = Handlebars.compile(templateSource);

const html = template({
  appName: "Clinica Verte",
  supportEmail: "suporte@exemplo.com",
  name: "Joao",
  resetUrl: "https://app.exemplo.com/reset-password?token=abc123",
  expiresIn: "60 minutos",
});
```
