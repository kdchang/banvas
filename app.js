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
        //expired 
        maxAge: new Date(Date.now() + 3600000*24*30)
    }));
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(require('faceplate').middleware({
        app_id: facebook_API,
        secret: facebook_secret,
        scope: 'user_likes,user_photos,user_photo_video_tags'
    }));
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

var confirm_list = {};

app.post('/signup', function(req, res){
    console.log(req.body);
    var query = req.body;
    if( query.email && query.password && query.first_name && query.last_name && query.id ){
        accountdb.findOne({$or:[{email:query.email},{id:query.id}]}).exec(function(err,data){
            if(err) throw err;
            if(data) res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
            else{
                var duplicate = false;
                if(confirm_list[query.id]) duplicate = true;
                for(i in confirm_list){
                    if(confirm_list[i].data.email == query.email){
                        duplicate = true;
                        break;
                    }
                }

                if(duplicate == true) res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
                else{
                    var token = randomString();
                    confirm_list[query.id] = {token:token, data: new accountdb(query)};
                    mail.server.send(mail.message(query.email, query.id, token),function(err,data){
                        if(err) console.log('sending confirmaton to \"'+query.email+'\" failed');
                        else console.log(data);
                    });
                    res.end(JSON.stringify({err:err_code.SUCCESS, confirm_list:token}));
                }
            }
        });
    }
    else res.end(JSON.stringify({err:err_code.DATA_INCOM})); 
});

app.get('/signup/confirmation', function(req, res){
    console.log(req.query);
    if( req.query.token && req.query.id && confirm_list[req.query.id] && confirm_list[req.query.id].token == req.query.token ){
        var account = confirm_list[req.query.id].data;
        account.register_date = Date.now(); 
        account.save(function(err, data){
            if(err) throw err;
            else{
                console.log(data);
                delete confirm_list[req.query.id];

                var token = randomString();
                req.session.item = {log_token: token, log_data: data};

                res.render('confirmation', {err:err_code.SUCCESS, id:data.id, token: token});
            }
        });
    }
    else res.render('confirmation', {err:err_code.CONFIRM_FAIL, id:req.query.id, token: '0'});
});

app.post('/login', function(req,res){
    console.log(req.body);
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
    console.log(req.body);
    check_login(req, function(status){
        console.log('user logooooout ' + JSON.stringify(req.body));
        if(status == err_code.SUCCESS || status == err_code.PERMISSION_DENIED){
            req.session.item = {};
            res.end(JSON.stringify({err:err_code.SUCCESS}));
        }
        else res.end(JSON.stringify({err:err_code.SUCCESS}));
    });
})

app.post('/:id/status', function(req, res){
    // check_login(req, function(status){
        // if( status == err_code.SUCCESS ){
            console.log(req.body);
            accountdb.findOne({id: req.params.id}).exec(function(err,data){
                if(err) throw err;
                if(data) {
                    console.log('load '+req.params.id+' status success!!!');

                    data.statistic.view_time = data.statistic.view_time + 1;

                    data.save(function(err, data){
                        if(err) throw err;
                        console.log(data);
                    });

                    var a = data.toObject();
                    trim(a, ['password','statistic','collect','modify_date']);
                    console.log(a);
					res.end(JSON.stringify({err:err_code.SUCCESS, data:a}));
				}
                else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
            })
        // }
        // else res.end(JSON.stringify({err:status}));
    // });
});

app.post('/:id/modify', function(req, res){
    console.log(req.body);
    check_login(req, function(status){
        if( status == err_code.SUCCESS ){
            var tmp = (new accountdb(req.body)).toObject();
            trim(tmp, ['email', 'password','collect','register_date']);
            for(i in tmp){
                if( i!='name' && !req.body[i] && i != 'modify_date' )
                    delete tmp[i];
            }
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
            accountdb.findOne({'id':req.params.id}).exec(function(err, data){
                if(err) throw err;
                // if(data) res.end(JSON.stringify({err:status}));
                // else {
                    console.log(data);
                    var pic = JSON.pase(data.Image_pkt);
                    fs.stat('/public/uploads/'+pic.head_url, function(err,www){
                        if(err) console.log(err);
                        console.log(www);
                    });
                    if(pic.head_url !== "default.png")
                        fs.unlink('/public/uploads/'+pic.head_url);
                    pic.head_url = head_url;
                    data.Image_pkt = JSON.stringify(pic);
                    data.save();

                    res.redirect('/'+req.params.id);
                // }
            })
   //          accountdb.findOneAndUpdate({'id':req.params.id},{$set:{Image_pkt:JSON.stringify({"head_url":head_url})}}).exec(function(err,data){
   //              if(err) throw err;
   //              console.log(data);
   //          });
			// res.redirect('/'+req.params.id);
		}
        else res.end(JSON.stringify({err:status}));
	});
});

app.post('/:id/collection_list', function(req, res){
    console.log(req.body);
    check_login(req, function(status){
        if( status == err_code.SUCCESS ){
            console.log(req.session.item.log_data);
            accountdb.findOne({'id':req.params.id},{collect:1}).exec(function(err, data){
                if(err) throw err;
                console.log(data);

                var collect = {};
                if(data.collect) collect = JSON.parse(data.collect);
                var list = {};
                for(i in collect){
                    if(list[collect[i]])
                        list[collect[i]].push(i);
                    else
                        list[collect[i]] = [i];
                }

                if(data) res.end(JSON.stringify({err:err_code.SUCCESS, collection: list}));
                else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
            });
        }
        else res.end(JSON.stringify({err:status}));
    });
});

app.post('/:id/save', function(req, res){
    console.log(req.body);
    check_login(req, function(status){
        if( status == err_code.SUCCESS){
            if( typeof(req.body.id) == typeof({}) ){
                var id = [];
                for(i in req.body.id){
                    id.push(i);
                }
                accountdb.find({'id':{$in:id}}, {_id:0, id:1}).exec(function(err, data){
                    if(err) throw err;
                    if(data.length>0){
                        accountdb.findOne({id:req.params.id}, {collect:1}).exec(function(err, owner){
                            if(err) throw err;
                            if(owner){
                                var updated = [];
                                var collect = {};
                                if(owner.collect) collect = JSON.parse(owner.collect);
                                for(i in data){
                                    collect[data[i].id] = req.body.id[data[i].id];
                                    updated.push(data[i].id);
                                }
                                owner.collect = JSON.stringify(collect);
                                owner.save();
                                res.end(JSON.stringify({err:err_code.SUCCESS, save:updated}));
                            }
                            else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
                        })
                    }
                    else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
                })
            }
            else res.end(JSON.stringify({err:err_code.DATA_FORMAT}));
        }
        else res.end(JSON.stringify({err:status}));
    });
});

app.post('/:id/delete', function(req, res){
    console.log(req.body);
    check_login(req, function(status){
        if(status == err_code.SUCCESS){
            if( typeof(req.body.id) == typeof([]) ){
                accountdb.findOne({id:req.params.id}, {collect:1}).exec(function(err, data){
                    if(err) throw err;
                    if(data){
                        var deleted = [];
                        var collect = {};
                        if( data.collect ) collect = JSON.parse(data.collect);

                        for(i in req.body.id){
                            if(collect[req.body.id[i]]){
                                delete collect[req.body.id[i]];
                                deleted.push(req.body.id[i]);
                            }
                        }
                        data.collect = JSON.stringify(collect);
                        data.save();
                        res.end(JSON.stringify({err:err_code.SUCCESS, update:deleted}));
                    }
                    else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
                })
            }
            else res.end(JSON.stringify({err:err_code.DATA_FORMAT}));
        }
        else res.end(JSON.stringify({err:status}));
    })
})

app.post('/:id/b-card_save', function(req, res){
    // check_login(req, function(status){
        // if( status == err_code.SUCCESS){
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
        // }
        // else res.end(JSON.stringify({err:status}));
    // });
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

app.post('/search', function(req, res){
    var query = req.body.query;
    if(typeof(query) == typeof("")){
        accountdb.find().exec(function(err, data){
            if(err) throw err;

            if(data){
                var result = [];
                for(var i=0; i<data.length; i++){
                    var score = 0;
                    // score += (data[i].email == query)*10;
                    score += ambiguous_match(data[i].email, query)*10;
                    score += ambiguous_match(data[i].name.first, query)*8;
                    score += ambiguous_match(data[i].name.last, query)*8;
                    score += ambiguous_match(data[i].id, query)*10;
                    score += ambiguous_match(data[i].Position, query)*5;
                    score += ambiguous_match(data[i].School, query)*5;
                    score += ambiguous_match(data[i].phone, query)*3;

                    result.push({id:data[i].id, score:score, name:data[i].name, email:data[i].email})
                }

                result.sort(function(a,b){
                    return a.score < b.score;
                });
                res.end(JSON.stringify({err:err_code.SUCCESS, data:result}));
            }
            else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR, data:[]}))
        });
    }
    else res.end(JSON.stringify({err:err_code.DATA_FORMAT}));
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

app.post('/:id/statistic', function(req, res){
    console.log(req.body);
    // check_login(req, function(status){
        // if(status==err_code.SUCCESS){
            accountdb.findOne({id: req.params.id},{_id:0, statistic:1}).exec(function(err, data){
                if(err) throw err;
                if(data)
                    res.end(JSON.stringify({err:err_code.SUCCESS, statistic:data.statistic}));
                else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
            })
        // }
        // else res.end(JSON.stringify({err:status}));
    // })
});

app.post('/all_list', function(req, res){
    console.log(req.body);

    var query = {};
    for(i in req.body.query){
        query[req.body.query[i]] = 1;
    }
    if( JSON.stringify(query) == "{}" ) query = {id:1, email:1, password:1};
    accountdb.find({},query, function(err,data){
        if(err) throw err;
        if(data){
            for(i in data){
                data[i] = data[i].toObject();
                delete data[i]._id;
            }
            res.end(JSON.stringify({err:err_code.SUCCESS,data:data}));
        }
        else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
    })
});

app.post('/pic_url', function(req, res){
    pic = req.body.pic.toLowerCase();
    switch(pic){
        case "中一中": case "北一女": case "北科大": case "北醫": 
            res.end("./school_pic/"+pic+".jpg");
            break;
        case "台大": case "NTU": case "National Taiwan University":
            res.end("./school_pic/台大.jpg");
            break;
        case "台科大": case "微軟": case "台科大":
            res.end("./school_pic/"+pic+".jpg");
            break;
        case "建中": case "ck": case "chien kuo":
            res.end("./school_pic/建中.jpg");
            break;
        case "武陵": case "wuling": case "wl":
            res.end("./school_pic/武陵.jpg");
            break;
        case "中一中": case "清大": case "政大": case "成功": case "facebook":
            res.end("./school_pic/"+pic+".jpg");
            break;
        case "garmin": case "google":
            res.end("./school_pic/"+pic+".jpg");
            break;
        default:
            res.end("./school_pic/school.jpg");
            break;
    }
})

// app.get('/facebook', function(req, res){
//     a.log(req.facebook);
//     req.facebook.me(function(user) {
//         res.render('facebook.ejs', {
//             layout: false,
//             req: req,
//             app: app,
//             user: user
//         });
//     });
// });

// // show friends
// app.get('/friends', function(req, res) {
//   req.facebook.get('/me/friends', { limit: 4 }, function(friends) {
//     res.send('friends: ' + require('util').inspect(friends));
//   });
// });

// // use fql to show my friends using this app
// app.get('/friends_using_app', function(req, res) {
//   req.facebook.fql('SELECT uid, name, is_app_user, pic_square FROM user WHERE uid in (SELECT uid2 FROM friend WHERE uid1 = me()) AND is_app_user = 1', function(friends_using_app) {
//     res.send('friends using app: ' + require('util').inspect(friends_using_app));
//   });
// });

// // perform multiple fql queries at once
// app.get('/multiquery', function(req, res) {
//   req.facebook.fql({
//     likes: 'SELECT user_id, object_id, post_id FROM like WHERE user_id=me()',
//     albums: 'SELECT object_id, cover_object_id, name FROM album WHERE owner=me()',
//   },
//   function(result) {
//     var inspect = require('util').inspect;
//     res.send('Yor likes: ' + inspect(result.likes) + ', your albums: ' + inspect(result.albums) );
//   });
// });

// app.get('/signed_request', function(req, res) {
//   res.send('Signed Request details: ' + require('util').inspect(req.facebook.signed_request));
// });

routes(app,accountdb);

var trim = function(account, constraint){
    delete account.__v;
    delete account._id;

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
    if( req.session.item && req.session.item.log_token && req.session.item.log_token ){
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

var kmp_search = function(s, w){
    var m = 0, i = 0, 
        pos, cnd, t,
        slen = s.length,
        wlen = w.length;
    
    s = s.split("");
    w = w.split("");    
            
    t = [-1, 0];
    for ( pos = 2, cnd = 0; pos < wlen; ) {
        if ( w[pos-1] === w[cnd] ) {
            t[pos] = cnd + 1;
            pos++; cnd++;
        }
        else if ( cnd > 0 )
        cnd = t[cnd];
        else 
          t[pos++] = 0;
    } 
    var max = 0;
    while ( m + i < slen ) {
        if ( s[m+i] === w[i] ) {
            i++;
            if (i>max) max = i;
            if ( i === wlen ) 
              return i;
        }
        else {
            m += i - t[i];
            if ( t[i] > -1 ) 
                i = t[i];
            else
                i = 0;
        }
    }
    return max;
}

var ambiguous_match = function(str1, str2){
    var max = 0;
    for(i=0; i<str2.length; i++){
        var tmp = kmp_search(str1, str2.slice(i));
        if( tmp>max ){
            max = tmp;
        }
    }
    return max
}

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
