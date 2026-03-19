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

// Set up mocks BEFORE requiring the service (service runs code at module load time)
const mockSendMail = jest.fn();
hbs.mockReturnValue(jest.fn());
nodemailer.createTransport.mockReturnValue({
  use: jest.fn(),
  sendMail: mockSendMail,
});

const { sendEmail } = require('../../src/services/emailService');

beforeEach(() => {
  mockSendMail.mockReset();
});

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
