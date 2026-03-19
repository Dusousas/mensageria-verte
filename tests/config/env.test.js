// Prevent dotenv from reading the .env file during tests — env vars are set manually
jest.mock('dotenv', () => ({ config: jest.fn() }));

test('throws when a required environment variable is missing', () => {
  // Set all vars except the one we want to test as missing
  process.env.SMTP_HOST = 'host';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'user';
  process.env.SMTP_PASS = 'pass';
  process.env.SMTP_FROM_NAME = 'Test';
  process.env.SMTP_FROM_EMAIL = 'test@test.com';
  delete process.env.API_KEY;
  jest.resetModules();
  expect(() => require('../../config/env')).toThrow(
    'Missing required environment variable: API_KEY'
  );
  process.env.API_KEY = 'restored';
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
