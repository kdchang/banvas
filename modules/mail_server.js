var email = require('emailjs/email');

module.exports = email.server.connect({
    user: "banvastest",
    password: "banvas12345",
    host: "smtp.gmail.com",
    ssl: true
});