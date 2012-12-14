var express = require('express')
	, routes = require('./routes')
	, user = require('./routes/user')
	, http = require('http')
	, path = require('path')
	, mongoose = require('mongoose')
	, fs = require('fs');

var accountdb = require('./modules/model');

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

var objectcheck = function(obj){
	for (i in obj) if (obj[i] == null) return false;
	return true;
}

var email = require('emailjs/email');
var server = email.server.connect({
	user: "banvastest",
	password: "banvas12345",
	host: "smtp.gmail.com",
	ssl: true
});

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
	console.log(response);
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
					//token = randomString();
					token = 'default';
				}
				queue[token] = JSON.stringify(response);
				/*
				var tmp = new accountdb(req.body);
				tmp.save();
				*/
				server.send(message(response.email, token));
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

app.configure('development', function(){
	app.use(express.errorHandler());
});

var databaseUrl = process.env.DATABASE_URL || 'mongodb://localhost/test';
mongoose.connect(databaseUrl);

app.get('/', function(req,res){
	res.render('index',{title:'test'});
});

var cookie = {};
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

app.get('/cookie', function(req, res, next){
	res.end( JSON.stringify(cookie) )
});

app.get('/:id/modify', function(req, res){
	console.log(req.params.id);
	accountdb.find({'username':req.params.id}).exec(function(err, data){
		
	})
});

app.get('/:id/list', function(req, res){
	accountdb.find().exec(function(err, data){
		if(err) throw err;
		console.log(data);
		res.end( JSON.stringify(data) );
	});
});

app.post('/:id/add', function(req, res){
	if( req.body.username || req.body.password ) res.end("NULL");
	else{
		accountdb.find({'username':req.body['username']}).exec(function(err, data){
			if(err) throw err;
			console.log(data);
			if( data.length > 0 ){
				res.end("user already exit!!!");
				accountdb.findById(data[0],function(err,data){
					if( err ) throw err;
					console.log(data);
				});
			}
			else{
				cookie[ req.body['username'] ] = randomString();
				var tmp = new accountdb();
				tmp.save(function(err){
					if( err ) throw err;
				});
				res.end("new user create");
			}
		});
	}
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
