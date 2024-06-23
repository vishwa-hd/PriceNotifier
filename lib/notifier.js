const nodemailer = require('nodemailer');
const scrapeAmazonPrice = require('./scraper');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function checkPrice(url, desiredPrice, email) {
  const priceString = await scrapeAmazonPrice(url);
  const price = parseFloat(priceString.replace(/[^0-9.-]+/g, ""));

  if (price <= desiredPrice) {
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Amazon Price Drop Alert',
      text: `The price for the item has dropped to ${priceString}. Check it out here: ${url}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });
  }
}

module.exports = checkPrice;
