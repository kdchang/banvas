var async = require('async')
    , express = require('express')
    , routes = require('./routes')
    , http = require('http')
    , path = require('path')
    , mongoose = require('mongoose')
    , fs = require('fs')
    , err_code = require('./define/err');

var databaseUrl = process.env.DATABASE_URL || 'mongodb://localhost/test';
var port = process.env.PORT || 3000;
var app_url = process.env.APP_URL || 'http://localhost';
console.log("USING DATABASE: "+databaseUrl );
console.log("APP_DOMAIN: "+app_url );
console.log("PORT: "+port)

var facebook_API = process.env.FACEBOOK_APP_ID || '471817496195401';
var facebook_secret = process.env.FACEBOOK_SECRET || 'c7dc96c61c425bf4ce8dada9868d3bb3';
console.log('FACEBOOK_APP_ID: '+facebook_API);
console.log('FACEBOOK_SECRET: '+facebook_secret);

mongoose.connect(databaseUrl);
var accountdb = require('./modules/model');
var bcardb = require('./modules/b_card_model');
var mail = require('./modules/mail_server');

var mongoStore = require('connect-mongo')(express);

var app = express();
app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('uploads_prefix', __dirname+'/public/uploads');
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
            url: databaseUrl
        }),
        maxAge: new Date(Date.now() + 3600000)
    }));
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(require('faceplate').middleware({
        app_id: facebook_API,
        secret: facebook_secret,
        scope: 'user_likes,user_photos,user_photo_video_tags'
    }));
    app.use(function(req, res, next){
        console.log(req.headers['host']);
        res.locals.host = req.headers['host'];
        res.locals.scheme = req.headers['x-forwarded-proto'] || 'http';
        res.locals.url = function(path){
            return app.dynamicViewHelpers.scheme(req, res) + app.dynamicViewHelpers.url_no_scheme(path);
        }
        res.locals.url_no_scheme = function(path){
            return '://' + app.dynamicViewHelpers.host(req, res) + path;
        }
        console.log(res.locals);
        next();
    });
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

var confirm_list = {};
app.post('/signup', function(req, res){
    var query = req.body;
    if( query.email && query.password && query.first_name && query.last_name && query.id ){
        accountdb.findOne({email:req.body.email}).exec(function(err,data){
            if(err) throw err;
            if(data) res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
            else{
                accountdb.findOne({id: query.id}).exec(function(err,result){
                    if(err) throw err;
                    if(result) res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
                    else{
                        var token = randomString();
                        confirm_list[token] = new accountdb(query);
                        mail.server.send(mail.message(query.email, token), function(err, data){
                            if(err) res.end(JSON.stringify({err:err_code.MAIL_ERROR}));
                            else res.end(JSON.stringify({err:err_code.SUCCESS}));
                            console.log(data);
                        });
                    }
                });
            }
        });
    }
    else res.end(JSON.stringify({err:err_code.DATA_INCOM}));
});

app.get('/signup/confirmation', function(req, res){
    if( req.query.token && confirm_list[req.query.token] ){
            var account = confirm_list[req.query.token];
            account.register_date = Date.now();
            account.save(function(err, data){
                if(err) throw err;
                else{
                    console.log(data);
                    delete confirm_list[req.query.token];

                    var token = randomString();
                    req.session.item = {log_token: token, log_data: data};

                    res.redirect('/user');
                }
            });
    }
    else res.end(JSON.stringify({err:err_code.TOKEN_UNMATCH}));
});

app.post('/login', function(req,res){
    if( req.body.email && req.body.password ){
        console.log('user loginnnng ' + JSON.stringify(req.body));
        accountdb.findOne( {email: req.body.email, password:req.body.password},{'password':1,'email':1, 'id':1}, function(err,data){
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
    check_login(req, function(status){
        console.log('user logooooout ' + JSON.stringify(req.body));
        if(status == err_code.SUCCESS || status == err_code.PERMISSION_DENIED){
            req.session.item = {};
            res.end(JSON.stringify({err:err_code.SUCCESS}));
        }
        else res.end(JSON.stringify({err:err_code.DATA_INCOM}));
    });
})

app.post('/:id/status', function(req, res){
    console.log(res.locals);
    // check_login(req, function(status){
        // if( status == err_code.SUCCESS ){
            accountdb.findOne({id: req.params.id},{_id:0,__v:0}, function(err,data){
                if(err) throw err;
                if(data) {
                    console.log('load '+req.params.id+' status success!!!');
					res.end(JSON.stringify({err:err_code.SUCCESS, data:data}));
				}
                else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
            })
        // }
        // else res.end(JSON.stringify({err:status}));
    // });
});

app.post('/:id/modify', function(req, res){
    check_login(req, function(status){
        if( status == err_code.SUCCESS ){
            var tmp = (new accountdb(req.body)).toObject();
            trim(tmp, ['email', 'password','collect']);
            console.log(tmp);
            accountdb.findOneAndUpdate({'id':req.params.id}, {$set:tmp}).exec(function(err,data){
                if(err) throw err;
                if(data) res.end(JSON.stringify({err:err_code.SUCCESS, update:tmp}));
                else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
            })
        }
        else res.end(JSON.stringify({err:status}));
    });
});

app.post('/:id/mod_img', function(req, res) {
	console.log(req.body);
	if(!req.body.title) throw new Error('no title');
    check_login(req, function(status){
        if( status == err_code.SUCCESS ){
            var head_url = req.files.file.path.replace(app.get('uploads_prefix'), '');
            accountdb.findOneAndUpdate({'id':req.params.id},{$set:{Image_pkt:JSON.stringify({"head_url":head_url})}}).exec(function(err,data){
                if(err) throw err;
                console.log(data);
            });
			res.redirect('/'+req.params.id);
		}
        else res.end(JSON.stringify({err:status}));
	});
});

app.post('/:id/collection_list', function(req, res){
    check_login(req, function(status){
        if( status == err_code.SUCCESS ){
            console.log(req.session.item.log_data);
            accountdb.findOne({'id':req.params.id},{collect:1}).exec(function(err, data){
                if(err) throw err;
                console.log(data);
                if(data) res.end(JSON.stringify({err:err_code.SUCCESS, collection: data.collect}));
                else res.end(JSON.stringify({err:err_code.PERMISSION_DENIED}));
            })
        }
        else res.end(JSON.stringify({err:status}));
    });
});

app.post('/:id/save', function(req, res){
    check_login(req, function(status){
        if( status == err_code.SUCCESS){
            var update = req.body.id.replace(/ /gm, "");
            update = update.split(',');
            accountdb.find({'id':{$in:update}},{_id:0,id:1}).exec(function(err, data){
                if(err) throw err;
                if(data.length>0){
                    accountdb.findOne({id:req.params.id}).exec(function(err,owner){
                        if(err) throw err;
                        if(owner){
                            var collect = [];
                            if(owner.collect) collect = owner.collect.split(',');
                            for(i in data){
                                if(collect.indexOf(data[i].id)==-1)
                                    collect.push(data[i].id);
                            }
                            owner.collect = collect.join(',');
                            owner.save();
                            res.end(JSON.stringify({err:err_code.SUCCESS, save:data}));
                        }
                        else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
                    })
                }
                else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
            })
        }
        else res.end(JSON.stringify({err:status}));
    });
});

app.post('/:id/b-card_save', function(req, res){
    check_login(req, function(status){
        if( status == err_code.SUCCESS){
            var bcard = new bcardb(req.body);
            bcard.email = req.session.item.log_data.email;
            bcard.password = req.session.item.log_data.password;
            bcardb.update({email:bcard.email},{$set:bcard.toObject()}).exec(function(err,data){
                if(err) throw err;
                if(data){
                    console.log(data);
                }
                else{
                    bcard.save(function(err, data){
                        if(err) throw err
                    });
                }
                res.end(JSON.stringify({err:err_code.SUCCESS}));
            })
        }
        else res.end(JSON.stringify({err:status}));
    });
});

app.post('/:id/b-card_load', function(req, res){
   check_login(req, function(status){
        if( status == err_code.SUCCESS){
            bcardb().find({email:req.session.item.log_data.email}).exec(function(err,data){
                if(err) throw err;
                if(data){
                    res.end(JSON.stringify({err:err_code.SUCCESS, collect:data}));
                }
                else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
            })
        }
        else res.end(JSON.stringify({err:status}));
    }); 
})

// app.post('/:id/configure_pull', function(req, res){
//     check_login(req, function(status){
//         if( status == err_code.SUCCESS){

//         }
//         else res.end(JSON.stringify({err:status}));
//     });
// });

// app.post('/:id/configure_push', function(req, res){
//    check_login(req, function(status){
//         if( status == err_code.SUCCESS){
//             bcardb().find({email:req.session.item.log_data.email}).exec(function(err,data){
//                 if(err) throw err;
//                 if(data){
//                     res.end(JSON.stringify({err:err_code.SUCCESS, collect:data}));
//                 }
//                 else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
//             })
//         }
//         else res.end(JSON.stringify({err:status}));
//     }); 
// })

app.get('/facebook', function(req, res){
    console.log(req.facebook);
    req.facebook.me(function(user) {
        res.render('facebook.ejs', {
            layout: false,
            req: req,
            app: app,
            user: user
        });
    });
});

// show friends
app.get('/friends', function(req, res) {
  req.facebook.get('/me/friends', { limit: 4 }, function(friends) {
    res.send('friends: ' + require('util').inspect(friends));
  });
});

// use fql to show my friends using this app
app.get('/friends_using_app', function(req, res) {
  req.facebook.fql('SELECT uid, name, is_app_user, pic_square FROM user WHERE uid in (SELECT uid2 FROM friend WHERE uid1 = me()) AND is_app_user = 1', function(friends_using_app) {
    res.send('friends using app: ' + require('util').inspect(friends_using_app));
  });
});

// perform multiple fql queries at once
app.get('/multiquery', function(req, res) {
  req.facebook.fql({
    likes: 'SELECT user_id, object_id, post_id FROM like WHERE user_id=me()',
    albums: 'SELECT object_id, cover_object_id, name FROM album WHERE owner=me()',
  },
  function(result) {
    var inspect = require('util').inspect;
    res.send('Yor likes: ' + inspect(result.likes) + ', your albums: ' + inspect(result.albums) );
  });
});

app.get('/signed_request', function(req, res) {
  res.send('Signed Request details: ' + require('util').inspect(req.facebook.signed_request));
});

routes(app,accountdb);

var trim = function(account, constraint){
    delete account._v;
    delete account._id;
    delete account.register_date;

    for(i in constraint){
        delete account[constraint[i]];
    }
}

var randomString = function(){
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz_";
    var string_length = 25;
    var result = '';
    for (var i=0; i<string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        result += chars.substring(rnum,rnum+1);
    }
    return result;
}

var check_login = function( req, callback ){
    if( req.session.item.log_token ){
        if( req.body.token ){
            if( req.session.item.log_token == req.body.token ){
                if( req.params.id && req.params.id == req.session.item.log_data.id )
                    callback(err_code.SUCCESS);
                else callback(err_code.PERMISSION_DENIED);
            }
            else callback(err_code.TOKEN_UNMATCH);
        }
        else callback(err_code.DATA_INCOM);
    }
    else callback(err_code.NOT_LOGIN);
}

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
