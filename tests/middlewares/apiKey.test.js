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
