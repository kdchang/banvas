var async = require('async')
    , express = require('express')
    , routes = require('./routes')
    , http = require('http')
    , path = require('path')
    , mongoose = require('mongoose')
    , fs = require('fs')
    , err_code = require('./define/err');

console.log(process.env.APP_URL);
console.log(process.env.DATABASE_URL);

var databaseUrl = process.env.DATABASE_URL || 'mongodb://localhost/test';
console.log(databaseUrl);
mongoose.connect(databaseUrl);
var accountdb = require('./modules/model');
var bcardb = require('./modules/b_card_model');
var mail = require('./modules/mail_server');

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
            url: databaseUrl
        }),
        maxAge: new Date(Date.now() + 3600000)
    }));
    app.use(app.router);
    // app.use(require('less-middleware')({ src: __dirname + '/public' }));
    // app.use(express.static(path.join(__dirname, 'public')));
    app.use(require('faceplate').middleware({
        app_id: process.env.FACEBOOK_APP_ID || '471817496195401',
        secret: process.env.FACEBOOK_SECRET || 'c7dc96c61c425bf4ce8dada9868d3bb3',
        scope: 'user_likes,user_photos,user_photo_video_tags'
    }))
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

app.post('/signup', function(req, res){
    var data = req.body;
    if( data.email && data.password && data.first_name && data.last_name && data.id ){
        accountdb.findOne({email:req.body.email}).exec(function(err,data){
            if(err) throw err;
            if(data) res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
            else{
                accountdb.findOne({id: req.body.id}).exec(function(err,data){
                    if(err) throw err;
                    if( data ) res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
                    else{
                        req.session.item = {signup_token: randomString(), signup_data: req.body};
                        mail.server.send(mail.message(req.session.item.signup_data['email'], req.session.item.signup_token), function(err, data){
                            if(err) res.end(JSON.stringify({err:err_code.MAIL_ERROR}));
                            else res.end(JSON.stringify({err:err_code.SUCCESS}));
                            console.log(data);
                        })
                    }
                })
            }
        })
    }
    else res.end(JSON.stringify({err:err_code.DATA_INCOM}));
});

app.get('/signup/confirmation', function(req, res){
    console.log(req.session);
    if( req.session.item && req.session.item.signup_token && req.session.item.signup_data ){
        if( req.session.item.signup_token == req.query.token ){
            var account = new accountdb(req.session.item.signup_data);
            account.register_date = Date.now();
            account.save(function(err, data){
                if(err) throw err;
                else{
                    console.log(data);
                    req.session.item = {};
                    res.end(JSON.stringify({err:err_code.SUCCESS}));
                }
            });
            
        }
        else res.end(JSON.stringify({err:err_code.TOKEN_UNMATCH}));
    }
    else res.end(JSON.stringify({err:err_code.CONFIRM_ERR}));
});

app.post('/login', function(req,res){

    if( req.body.email && req.body.password ){
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
        if(status == err_code.SUCCESS || status == err_code.PERMISSION_DENIED){
            req.session.item = {};
            res.end(JSON.stringify({err:err_code.SUCCESS}));
        }
        else res.end(JSON.stringify({err:status}));
    });
});

app.post('/:id/status', function(req, res){
    console.log(req.facebook);

    check_login(req, function(status){
        if( status == err_code.SUCCESS ){
            accountdb.find({id: req.params.id},{_id:0,__v:0}, function(err,data){
                if(err) throw err;
                if(data) res.end(JSON.stringify({err:status, data:data}));
                else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
            })
        }
        else res.end(JSON.stringify({err:status}));
    });
});

var trim = function(account, constraint){
    delete account._v;
    delete account._id;
    delete account.register_date;

    for( i in constraint){
        delete account[constraint[i]];
    }
}

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
                console.log(data);
                if(data.length>0){
                    accountdb.findOne({id:req.params.id}).exec(function(err,owner){
                        if(err) throw err;
                        if(owner){
                            var collect = [];
                            if(owner.collect) collect = owner.collect.split(',');
                            for(i in data){
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

app.get('/', routes.index );
app.get('/login', routes.login );
app.get('/test', routes.test );
app.get('/facebook', function(req, res){
    console.log(req);
    req.facebook.me(function(user) {
        res.render('facebook.ejs', {
            layout: false,
            req: req,
            app: app,
            user: user
        });
    });
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
