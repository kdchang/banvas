var express = require('express')
    , routes = require('./routes')
    , http = require('http')
    , path = require('path')
    , mongoose = require('mongoose')
    , fs = require('fs')
    , err_code = require('./define/err');

var databaseUrl = process.env.DATABASE_URL || 'mongodb://localhost/test';
mongoose.connect(databaseUrl);
var accountdb = require('./modules/model');
var mail = require('./modules/mail_server');

// var ss = new accountdb({id:"default"});
// accountdb
//     .find({email:'ddmail2009@gmail.com'})
//     .sort('register_date')
//     .exec(function(err, account){
//     if(err) throw err;
//     console.log('find');
//     console.log(account);
// });

var mongoStore = require('connect-mongo')(express);

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
    app.use(express.session({
        secret: 'Banvas',
        store: new mongoStore({
            host: '127.0.0.1',
            db: 'test',
            collection: 'mysession'
        }),
        maxAge: new Date(Date.now() + 3600000)
    }));
    app.use(app.router);
    app.use(require('less-middleware')({ src: __dirname + '/public' }));
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

app.post('/signup', function(req, res){
    var data = req.body;
    if( data.email && data.password && data.first_name && data.last_name && data.id ){
        accountdb.findOne({email:req.body.email}).exec(function(err,data){
            if(err) throw err;
            if( data )
                res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
            else{
                // req.session.item = {signup_token: randomString(), signup_data: req.body};
                req.session.item = {signup_token: 'default', signup_data: req.body};
                mail.server.send(mail.message(req.session.item.signup_data['email'], req.session.item.signup_token), function(err, data){
                    if(err) res.end(JSON.stringify({err:err_code.MAIL_ERROR}));
                    else res.end(JSON.stringify({err:err_code.SUCCESS}));
                    console.log(data);
                })
            }
        })
    }
    else res.end(JSON.stringify({err:err_code.DATA_INCOM}));
});

app.get('/signup/confirmation', function(req, res){
    if( req.session.item.signup_token && req.session.item.signup_data ){
        if( req.session.item.signup_token == req.query.token ){
            var account = new accountdb(req.session.item.signup_data);
            account.save(function(err, data){
                if(err) throw err;
                console.log(data);
            });
            req.session.item = {};
            res.end(JSON.stringify({err:err_code.SUCCESS}));
        }
        else res.end(JSON.stringify({err:err_code.TOKEN_UNMATCH}));
    }
    else res.end(JSON.stringify({err:err_code.CONFIRM_ERR}));
});

app.post('/login', function(req,res){
    if( req.body.email && req.body.password ){
        accountdb.findOne( {email: req.body.email, password:req.body.password}, function(err,data){
            if( data ){
                var token = randomString();
                req.session.item = {log_token: token, log_data: data};
                res.end(JSON.stringify({err:err_code.SUCCESS, id:data.id, token:token}));
            }
            else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
        });
    }
    else res.end(JSON.stringify({err:err_code.DATA_INCOM}));
});

app.post('/logout', function(req, res){
    if( req.session.item.log_token ){
        if( req.body.token ){
            if( req.session.item.log_token == req.body.token ){
                req.session.item = {};
                res.end(JSON.stringify({err:err_code.SUCCESS}));
            }
            else res.end(JSON.stringify({err:err_code.TOKEN_UNMATCH}));
        }
        else res.end(JSON.stringify({err:err_code.DATA_INCOM}));
    }
    else res.end(JSON.stringify({err:err_code.NOT_LOGIN}))
})

app.post('/:id/status', function(req, res){
    check_login(req, function(status){
        if( status == err_code.SUCCESS ){
            accountdb.find({id: req.params.id}, function(err,data){
                if(err) throw err;
                res.end(JSON.stringify({err:status, data:data}));
            })
        }
        else res.end(JSON.stringify({err:status}));
    })
})

app.post('/:id/modify', function(req, res){
    check_login(req, function(status){
        if( status == err_code.SUCCESS ){
            accountdb.findOneAndUpdate({'id':req.params.id}).exec(function(err,data){
                if(err) throw err;
                var tmp = new accountdb(req.body);
                console.log(tmp);
                console.log(data);
            })
        }
        else res.end(JSON.stringify({err:status}));
    });
})

var check_login = function( req, callback ){
    if( req.session.item.log_token ){
        if( req.body.token ){
            if( req.session.item.log_token == req.body.token ){
                callback(err_code.SUCCESS);
            }
            else callback(err_code.TOKEN_UNMATCH);
        }
        else callback(err_code.DATA_INCOM);
    }
    else callback(err_code.NOT_LOGIN);
}

app.get('/', routes.index );
app.get('/login', routes.login )

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