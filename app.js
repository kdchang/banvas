var express = require('express')
    , routes = require('./routes')
    , user = require('./routes/user')
    , http = require('http')
    , path = require('path')
    , mongoose = require('mongoose')
    , fs = require('fs');

var databaseUrl = process.env.DATABASE_URL || 'mongodb://localhost/test';
mongoose.connect(databaseUrl);
var accountdb = require('./modules/model');
var mail_server = require('./modules/mail_server');

var app = express();
app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser({
        keepExtensions : true,
        uploadDir      : __dirname + '/public/uploads'
    }));
    app.use(express.methodOverride());
    app.use(express.cookieParser('your secret here'));
    app.use(express.session());
    app.use(app.router);
    app.use(require('less-middleware')({ src: __dirname + '/public' }));
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

var objectcheck = function(obj){
    for (i in obj) if (obj[i] == null) return false;
    return true;
}

var message = function(email, token){
    return {
        text: "Welcome to Banvas!!!\n Please enter the following link to complete signup!!!\n"+
            "http://localhost:3000/signup/confirmation?token="+token,
            from: "Banvas <ddmail2009@gmail.com>",
            to: email,
            cc: null,
        subject: "Welcome to Banvas",
    };
};

var queue = {}
app.post('/signup', function(req, res){
    response = { 'status':'NCK', 'email':null, 'first_name':null, 'last_name':null, 'id':null, 'password':null };
    for (i in req.body) response[i] = req.body[i];

    if( !objectcheck(response) ){
        response.status = 'NCK'
        res.end(JSON.stringify(response));
    }
    else{
        accountdb.find({'email':req.body.email}).exec(function(err, data){
            if(err) throw err;
            console.log(data);
            if( data.length > 0 ){
                response.status = 'NCK'
                res.end(JSON.stringify(response));
            }
            else{
                response.status = 'ACK';
                var token = null;
                for(i in queue){
                    if( JSON.stringify(response) == queue[i] ){
                        token = i
                    }
                }
                if( token == null ){
                    /*
                    while(true){
                        token = randomString();
                        if(queue[token]) break;
                    }
                    */
                    token = 'default';
                }
                queue[token] = JSON.stringify(response);
                mail_server.send(message(response.email, token));
                res.end(JSON.stringify(response));
            }
        });
    }
});

app.get('/signup/confirmation', function(req, res){
    var token = req.query.token;
    var response = {'status':'NCK'};
    
    console.log(queue);
    console.log(token);
    console.log(JSON.parse(queue[token]));

    if(queue[token] != null){
        response['status'] = 'ACK';
        var tmp = new accountdb(JSON.parse(queue[token]));
        tmp.save();
        queue[token] = null;
    }
    console.log(queue);
    res.end(JSON.stringify(response));
});


var session = {};
app.post('/login', function(req,res){
    var response = {'status':'NCK', 'email':null, 'password':null};
    for (i in response) response[i] = req.body[i];

    if( req.body['email'] && req.body['password'] ){
        accountdb.find( {email: req.body}, function(err,data){
            var response = {'status':'ACK'};
            response['id'] = data['id'];

            var token = null;
            while(true){
                token = randomString();
                if(!session[token])break;
            }
            response['token'] = token;

            res.end(JSON.stringify(response))
        })
    }
    else{
        res.end(JSON.stringify({'status':'NCK'}));
    }
});



app.get('/', function(req,res){
    res.render('index',{title:'test'});
});

var randomString = function(){
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    var string_length = 20;
    var result = '';
    for (var i=0; i<string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        result += chars.substring(rnum,rnum+1);
    }
    return result;
}

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
