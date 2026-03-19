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
