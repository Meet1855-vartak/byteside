const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: 'byteside.contact@gmail.com',
    pass: 'sfotbxuaibiadeqw',
  },
});

transporter.sendMail(
  {
    from: '"Byteside" <byteside.contact@gmail.com>',
    to: 'byteside.contact@gmail.com',
    subject: 'Test email',
    text: 'Testing Gmail SMTP directly.',
  },
  (err, info) => {
    if (err) {
      console.error('FAILED:', err);
    } else {
      console.log('SUCCESS:', info);
    }
  }
);