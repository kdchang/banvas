var err_code = require('./err');
var f = require('./function');

module.exports = function(app, accountdb){
    app.post('/:id/collect/list', function(req, res){
        console.log(req.body);
        f.login_and_find(req, res, accountdb, function(data){
            var list = {};
            var collect = JSON.parse(data.collect);
            for(i in collect){
                if(list[collect[i]])
                    list[collect[i]].push(i);
                else 
                    list[collect[i]] = [i];
            }
            res.end(JSON.stringify({err:err_code.SUCCESS, collection: list}));
        });
    });

    app.post('/:id/collect/save', function(req, res){
        console.log(req.body);
        f.check_login(req, function(status){
            if( status == err_code.SUCCESS){
                var update = req.body.id;
                if( typeof(update) == typeof("") ){
                    try{
                        update = JSON.parse(update);
                    }
                    catch(err){
                        console.log(err);
                        res.end(JSON.stringify({err:err_code.DATA_FORMAT}));
                    }
                }
                console.log(update);

                if( typeof(update) == typeof({}) ){
                    var id = [];
                    for(i in update){
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
                                        collect[data[i].id] = update[data[i].id];
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
            }
            else res.end(JSON.stringify({err:status}));
        });
    });

    app.post('/:id/collect/delete', function(req, res){
        console.log(req.body);
        f.check_login(req, function(status){
            if(status == err_code.SUCCESS){
                    accountdb.findOne({id:req.params.id}, {collect:1}).exec(function(err, data){
                        if(err) throw err;
                        if(data){
                            var deleted = [];
                            var collect = {};
                            if( data.collect ) collect = JSON.parse(data.collect);

                            for(i in req.body.id){
                                if(collect.hasOwnProperty(req.body.id[i])){
                                    delete collect[req.body.id[i]];
                                    deleted.push(req.body.id[i]);
                                }
                            }
                            data.collect = JSON.stringify(collect);
                            data.save();
                            res.end(JSON.stringify({err:err_code.SUCCESS, update:deleted}));
                        }
                        else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
                    });
            }
            else res.end(JSON.stringify({err:status}));
        });
    });
}