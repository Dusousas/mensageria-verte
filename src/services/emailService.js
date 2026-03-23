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
      partialsDir: path.resolve(__dirname, '../templates/partials'),
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
