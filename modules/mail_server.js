var email = require('emailjs/email');

// module.exports = email.server.connect({
exports.server = email.server.connect({
    user: "banvastest",
    password: "banvas12345",
    host: "smtp.gmail.com",
    ssl: true
});

exports.message =  function(email, id, token){
    var address = process.env.APP_URL || 'http://localhost:3000';
    return {
        text: "Welcome to Banvas!!!\n Please enter the following link to complete signup!!!\n"+
                address+"/signup/confirmation?token="+token+"&id="+id,
        from: "Banvas <banvastest@gmail.com>",  
        to: email,
        cc: null,
        subject: "Welcome to Banvas"
    };
};