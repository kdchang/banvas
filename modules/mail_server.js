var email = require('emailjs/email');

// module.exports = email.server.connect({
exports.server = email.server.connect({
    user: "banvastest",
    password: "banvas12345",
    host: "smtp.gmail.com",
    ssl: true
});

exports.message =  function(email, token){
    return {
        text: "Welcome to Banvas!!!\n Please enter the following link to complete signup!!!\n"+
                process.env.APP_URL+"/signup/confirmation?token="+token,
        from: "Banvas <banvastest@gmail.com>",
        to: email,
        cc: null,
        subject: "Welcome to Banvas"
    };
};