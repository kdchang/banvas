
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose');
 
var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
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

var account_schema = new mongoose.Schema({
	username   : {type:String, require:true},
	password   : {type:String, require:true},
	email 	   : {type:String, require:true},
	first_name : {type:String},
	last_name  : {type:String},
	linked     : {type:{Facebook:String, Blogger:String, Linkedin:String}, require:true},
	Position   : {type:String},
	Intro      : {type:String},
        School     : {type:String},
	Skill      : {type:String},
	TimeLine   : {type:String},
	Job_exp    : {type:String},
	Image_pkt  : {type:String},
	user_url   : {type:String},
	phone      : {type:String},
	id         : mongoose.Schema.ObjectId,
});

var accountdb = mongoose.model('ASBD', account_schema);

app.get('/', function(req,res){
	res.render('index',{title:'test'});
});

app.post('/save', function(req,res){
	console.log(req.body)
	if( !req.body.hasOwnProperty('username') || !req.body.hasOwnProperty('password') ) res.end("NULL");
	else{
		accountdb.find({'username':req.body['username']}).exec(function(err, data){
			if(err) throw err;
			console.log(data);
			if( data.length > 0 ){
				res.end("matched!!");
				accountdb.findById(data[0],function(err,data){
					if( err ) throw err;
					console.log(data);
				});
			}
			else{
				res.send("no");
				var tmp = new accountdb(req.body);
				console.log(tmp);
				tmp.save();
			}
		});
	}
});

app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
