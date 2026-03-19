jest.mock('../../src/services/emailService', () => ({ sendEmail: jest.fn() }));
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
