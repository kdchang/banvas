var async   = require('async')
    , express = require('express')
    , util    = require('util')
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

var mongoStore = require('connect-mongo')(express);

// create an express webserver
// listen to the PORT given to us in the environment
var port = process.env.PORT || 3000;
var app = express.createServer(
  express.logger(),
  express.static(__dirname + '/public'),
  express.bodyParser({
    keepExtensions: true,
    uploadDir: __dirname + '/public/uploads'
  }),
  express.cookieParser('your secret here'),
  express.session({
      secret: "Banvas",
      store: new mongoStore({
        host: '127.0.0.1',
        db: 'test',
        collection: 'mysession'
      })
  }),
  // set this to a secret value to encrypt session cookies
  // express.session({ secret: process.env.SESSION_SECRET || 'secret123' }),
  require('faceplate').middleware({
    app_id: process.env.FACEBOOK_APP_ID,
    secret: process.env.FACEBOOK_SECRET,
    scope:  'user_likes,user_photos,user_photo_video_tags'
  })
);

app.listen(port, function() {
  console.log("Listening on " + port);
});
app.configure('development', function(){
  app.use(express.errorHandler());
});

app.dynamicHelpers({
  'host': function(req, res) {
    return req.headers['host'];
  },
  'scheme': function(req, res) {
    req.headers['x-forwarded-proto'] || 'http'
  },
  'url': function(req, res) {
    return function(path) {
      return app.dynamicViewHelpers.scheme(req, res) + app.dynamicViewHelpers.url_no_scheme(path);
    }
  },
  'url_no_scheme': function(req, res) {
    return function(path) {
      return '://' + app.dynamicViewHelpers.host(req, res) + path;
    }
  },
});

function render_page(req, res) {
  req.facebook.app(function(app) {
    req.facebook.me(function(user) {
      res.render('facebook.ejs', {
        layout:    false,
        req:       req,
        app:       app,
        user:      user
      });
    });
  });
}

function handle_facebook_request(req, res) {
  console.log(req.facebook);
  // if the user is logged in
  if (req.facebook.token) {
    async.parallel([
      function(cb) {
        // query 4 friends and send them to the socket for this socket id
        req.facebook.get('/me/friends', { limit: 4 }, function(friends) {
          req.friends = friends;
          cb();
        });
      },
      function(cb) {
        // query 16 photos and send them to the socket for this socket id
        req.facebook.get('/me/photos', { limit: 16 }, function(photos) {
          req.photos = photos;
          cb();
        });
      },
      function(cb) {
        // query 4 likes and send them to the socket for this socket id
        req.facebook.get('/me/likes', { limit: 4 }, function(likes) {
          req.likes = likes;
          cb();
        });
      },
      function(cb) {
        // use fql to get a list of my friends that are using this app
        req.facebook.fql('SELECT uid, name, is_app_user, pic_square FROM user WHERE uid in (SELECT uid2 FROM friend WHERE uid1 = me()) AND is_app_user = 1', function(result) {
          req.friends_using_app = result;
          cb();
        });
      }
    ], function() {
      render_page(req, res);
    });

  } else {
    render_page(req, res);
  }
}

app.get('/facebook', handle_facebook_request);
app.post('/facebook', handle_facebook_request);


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
                    console.log(err||data);
                })
                res.end(JSON.stringify({err:err_code.SUCCESS}));
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
			res.redirect('/');
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
            var tmp = new accountdb(req.body);
            console.log(tmp);
            accountdb.findOneAndUpdate({'id':req.params.id}).exec(function(err,data){
                if(err) throw err;
                console.log(data);
            })
        }
        else res.end(JSON.stringify({err:status}));
    });
})
var prefix = __dirname + '/public/uploads/';
var head_url;
app.post('/:id/mod_img', function(req, res) {
	console.log(req.body);
	if(!req.body.title) throw new Error('no title');
    check_login(req, function(status){
        if( status == err_code.SUCCESS ){
            var tmp = new accountdb(req.body);
            accountdb.findOneAndUpdate({'id':req.params.id}).exec(function(err,data){
                if(err) throw err;
                console.log(data);
            });
			head_url = req.files.file.path.replace(prefix, '');
			console.log(head_url);	
			res.redirect('/user');
		}
        else res.end(JSON.stringify({err:status}));
	});
});
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
app.get('/login', routes.login );
app.get('/user',function(req,res){
	res.render('user.ejs',{layout: false, title: 'Signup',head_url: head_url});
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
