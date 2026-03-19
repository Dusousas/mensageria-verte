// Use factory functions to avoid Jest loading the real modules (which trigger config/dotenv)
jest.mock('../../src/services/emailService', () => ({ sendEmail: jest.fn() }));
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
