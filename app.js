var async = require('async')
    , express = require('express')
    , routes = require('./routes')
    , http = require('http')
    , path = require('path')
    , mongoose = require('mongoose')
    , fs = require('fs')
    , gm = require('gm')
    , imageMagick = gm.subClass({ imageMagick: true });

var err_code = require('./err')
    , skill_app = require('./skill_app')
    , collect_app = require('./collect_app')
    , resume_app = require('./resume_app')
    , f = require('./function');

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
                    var token = f.randomString();
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

                var token = f.randomString();
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
                var token = f.randomString();
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
    f.check_login(req, function(status){
        console.log('user logooooout ' + JSON.stringify(req.body));
        if(status == err_code.SUCCESS || status == err_code.PERMISSION_DENIED){
            req.session.item = {};
            res.end(JSON.stringify({err:err_code.SUCCESS}));
        }
        else res.end(JSON.stringify({err:err_code.SUCCESS}));
    });
})

app.post('/:id/status', function(req, res){
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
            f.trim(a, ['password','statistic','collect','modify_date']);
            console.log(a);
			res.end(JSON.stringify({err:err_code.SUCCESS, data:a}));
		}
        else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
    })
});

app.post('/:id/modify', function(req, res){
    console.log(req.body);
    f.check_login(req, function(status){
        if( status == err_code.SUCCESS ){
            var tmp = (new accountdb(req.body)).toObject();
            f.trim(tmp, ['email', 'password','collect','register_date','resume','Skill']);
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
    
    var head_url = req.files.file.path.replace(app.get('uploads_prefix'), '');
    console.log(head_url);
    console.log(req.files.file.path);
    accountdb.findOne({'id':req.params.id}).exec(function(err, data){
        if(err) throw err;
        if(data){
            if(data.Image_pkt.picture !== "default.png")
                fs.unlink('public/uploads'+data.Image_pkt.picture);
            if(data.Image_pkt.pictureSmall !== 'default.png')
                fs.unlink('public/uploads'+data.Image_pkt.picture);
            
            imageMagick(req.files.file.path)
                .resize(250, 250)
                .noProfile()
                .write(req.files.file.path, function (err) {
                    if(err) throw err;
                    if (!err) console.log('done');
                });
            imageMagick(req.files.file.path)
                .resize(60, 60)
                .noProfile()
                .write('public/uploads/'+req.params.id+'_small.jpg', function (err) {
                    if (!err) console.log('done');
                });

            data.Image_pkt.picture = head_url;
            data.Image_pkt.pictureSmall = '/'+req.params.id+'_small.jpg';
            data.save();
            console.log(data.Image_pkt);
            res.redirect('/'+req.params.id);
        }
        else res.redirect('/'+req.params.id);
    })
});

// app.post('/:id/b-card_save', function(req, res){
//     // f.check_login(req, function(status){
//         // if( status == err_code.SUCCESS){
//             var bcard = new bcardb(req.body);
//             bcard.email = req.session.item.log_data.email;
//             bcard.password = req.session.item.log_data.password;
//             bcardb.update({email:bcard.email},{$set:bcard.toObject()}).exec(function(err,data){
//                 if(err) throw err;
//                 if(data){
//                     console.log(data);
//                 }
//                 else{
//                     bcard.save(function(err, data){
//                         if(err) throw err
//                     });
//                 }
//                 res.end(JSON.stringify({err:err_code.SUCCESS}));
//             })
//         // }
//         // else res.end(JSON.stringify({err:status}));
//     // });
// });

// app.post('/:id/b-card_load', function(req, res){
//    f.check_login(req, function(status){
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

app.post('/search', function(req, res){
    var query = req.body.query;
    console.log(req.body);
    if(typeof(query) == typeof("")){
        accountdb.find().exec(function(err, data){
            if(err) throw err;

            if(data.length>0){
                var result = [];
                for(var i=0; i<data.length; i++){
                    var score = 0;
                    // score += (data[i].email == query)*10;
                    if(data[i].email) score += ambiguous_match(data[i].email, query)*6;
                    if(data[i].name.first) score += ambiguous_match(data[i].name.first, query)*10;
                    if(data[i].name.last) score += ambiguous_match(data[i].name.last, query)*10;
                    if(data[i].id) score += ambiguous_match(data[i].id, query)*9;
                    if(data[i].About_me) score += ambiguous_match(data[i].About_me, query)*5;
                    if(data[i].Job_exp) score += ambiguous_match(data[i].Job_exp, query)*3;
                    if(data[i].phone) score += ambiguous_match(data[i].phone, query)*2;

                    result.push({id:data[i].id, score:score, name:data[i].name, email:data[i].email, Image_pkt:data[i].Image_pkt, full_name:data[i].name.full});
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
//     f.check_login(req, function(status){
//         if( status == err_code.SUCCESS){

//         }
//         else res.end(JSON.stringify({err:status}));
//     });
// });

// app.post('/:id/configure_push', function(req, res){
//    f.check_login(req, function(status){
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
    f.check_login(req, function(status){
        if(status==err_code.SUCCESS){
            accountdb.findOne({id: req.params.id},{_id:0, statistic:1}).exec(function(err, data){
                if(err) throw err;
                if(data)
                    res.end(JSON.stringify({err:err_code.SUCCESS, statistic:data.statistic}));
                else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
            })
        }
        else res.end(JSON.stringify({err:status}));
    })
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

collect_app(app, accountdb);
skill_app(app, accountdb);
resume_app(app, accountdb);
routes(app, accountdb);

app.post('/:id/ios/status', function(req, res){
    console.log(req.body);
    f.check_login(req, function(status){
        if( status == err_code.SUCCESS ){
            accountdb.findOne({id:req.params.id},{collect:1}).exec(function(err, owner){
                if(err) throw err;
                if(owner){
                    var id = [], tag = [];
                    var collect = JSON.parse(owner.collect);
                    console.log(owner.collect);
                    for(i in collect){
                        for(j in collect[i]){
                            id.push(collect[i][j]);
                            tag.push(collect[i]);
                        }
                    }
                    console.log(id);
                    accountdb.find({id:{$in:id}}).exec(function(err, data){
                        if(err) throw err;
                        if(data.length > 0){
                            var result = [];
                            for(i in collect){
                                for(j in collect[i]){
                                    for(l in data){
                                        console.log(collect[i][j]);
                                        if(data[l].id == collect[i][j]){
                                            var user = {};

                                            user.id = data[l].id;
                                            user.name = data[l].name.full;
                                            user.tag = i;
                                            user.resume = data[l].resume;
                                            user.pictureSmall = data[l].Image_pkt.pictureSmall
                                            result.push(user);
                                        }
                                    }
                                }
                            }
                            res.end(JSON.stringify({err:err_code.SUCCESS,data:result}));
                        }
                        else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
                    })
                }
                else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
            });
        }
        else res.end(JSON.stringify({err:status}));
    })
})

app.post('/:id/ios/detail', function(req, res){
    f.check_login(req, function(status){
        if(status == err_code.SUCCESS || status == err_code.PERMISSION_DENIED){
            accountdb.findOne({id:req.params.id}).exec(function(err, data){
                if(err) throw err;
                if(data){
                    var result = {};
                    result.about_me = data.About_me;
                    result.picture = data.Image_pkt.picture;
                    result.email = data.email;
                    result.phone_number = data.phone;
                    result.linked = data.linked;
                    result.resume = data.resume;

                    var skill = [];
                    var user_skill = JSON.parse(data.Skill);
                    for(i in user_skill){
                        skill.push(i);
                    }
                    result.skill = skill;
                    res.end(JSON.stringify({err:err_code.SUCCESS, data:result}));
                }
                else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
            });
        } 
        else res.end(JSON.stringify({err:status}));
    })
})

var ambiguous_match = function(str1, str2){
    var max = 0;
    for(i=0; i<str2.length; i++){
        var tmp = f.kmp_search(str1, str2.slice(i));
        if( tmp>max ){
            max = tmp;
        }
    }
    return max
}


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
