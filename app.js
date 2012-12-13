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

app.post('/save', function(req,res){
	console.log(req.body)
	if( !req.body.username || !req.body.password || !req.body.email ) res.end("NULL");
	else{
		accountdb.find({'username':req.body.username}).exec(function(err, data){
			if(err) throw err;
			console.log(data);
			if( data.length > 0 ){
				res.end("user already exist!!!");
				accountdb.findById(data[0],function(err,data){
					if( err ) throw err;
					console.log(data);
				});
			}
			else{
				cookie[ req.body['username'] ] = randomString();
				var tmp = new accountdb(req.body);
				tmp.save(function(err){
					if( err ) throw err;
				});
				res.end("new user create");
			}
		});
	}
});

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
