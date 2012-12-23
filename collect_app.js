var err_code = require('./err');
var f = require('./function');

module.exports = function(app, accountdb){
    app.post('/:id/collect/list', function(req, res){
        console.log(req.body);
        f.login_and_find(req, res, accountdb, function(data){
            var list = {};
            var collect = JSON.parse(data.collect);
            res.end(JSON.stringify({err:err_code.SUCCESS, collection: collect}));
        });
    });

    app.post('/:id/collect/save', function(req, res){
        console.log(req.body);
        f.check_login(req, function(status){
            if( status == err_code.SUCCESS){
                accountdb.findOne({'id':req.body.id}, {_id:0, id:1}).exec(function(err, data){
                    if(err) throw err;
                    if(data){
                        accountdb.findOne({id:req.params.id}, {collect:1}).exec(function(err, owner){
                            if(err) throw err;
                            if(owner){
                                var updated = [];
                                var collect = {};
                                
                                if(owner.collect) collect = JSON.parse(owner.collect);
                                console.log(collect);
                                console.log(collect[req.body.tag]);

                                if( collect[req.body.tag] ){
                                    collect[req.body.tag].push(req.body.id);
                                    updated.push(data.id);
                                    owner.collect = JSON.stringify(collect);
                                    owner.save();
                                    res.end(JSON.stringify({err:err_code.SUCCESS, save:updated}));
                                }
                                else res.end(JSON.stringify({err:err_code.INVALID_OP}));
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

    app.post('/:id/collect/save_empty', function(req, res){
        console.log(req.body);
        f.check_login(req, function(status){
            if(status == err_code.SUCCESS){
                accountdb.findOne({id:req.params.id}).exec(function(err, data){
                    if(err) throw err;
                    if(data){
                        var collect = JSON.parse(data.collect);
                        if(collect[req.body.tag]) res.end(JSON.stringify({err:err_code.DUPLICATE}));
                        else{
                            collect[req.body.tag] = [];
                            data.collect = JSON.stringify(collect);
                            data.save();

                            res.end(JSON.stringify({err:err_code.SUCCESS, data:req.body.tag}));
                        }
                    }
                    else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
                })
            }
            else res.end(JSON.stringify({err:status}));
        })
    })

    app.post('/:id/collect/delete', function(req, res){
        console.log(req.body);
        f.check_login(req, function(status){
            if(status == err_code.SUCCESS){
                accountdb.findOne({id:req.params.id}, {collect:1}).exec(function(err, data){
                    if(err) throw err;
                    if(data){
                        var collect = {};
                        if( data.collect ) collect = JSON.parse(data.collect);

                        if( collect[req.body.tag] ){
                            f.removeA(collect[req.body.tag], req.body.id);
                            data.collect = JSON.stringify(collect);
                            data.save();

                            res.end(JSON.stringify({err:err_code.SUCCESS}));
                        }                        
                        else res.end(JSON.stringify({err:err_code.INVALID_OP}));
                    }
                    else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
                });
            }
            else res.end(JSON.stringify({err:status}));
        });
    });

    app.post('/:id/collect/delete_empty', function(req, res){
        console.log(req.body);
        f.check_login(req, function(status){
            if(status == err_code.SUCCESS){
                accountdb.findOne({id:req.params.id}).exec(function(err, data){
                    if(err) throw err;
                    if(data){
                        var collect = JSON.parse(data.collect);
                        if( collect[req.body.tag] && collect[req.body.tag].length < 1){
                            delete collect[req.body.tag];
                            data.collect = JSON.stringify(collect);
                            data.save();

                            res.end(JSON.stringify({err:err_code.SUCCESS}));
                        }
                        else res.end(JSON.stringify({err:err_code.INVALID_OP}));
                    }
                    else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
                });
            }
            else res.end(JSON.stringify({err:status}));
        });
    });

    app.post('/:id/collect/move', function(req, res){
        console.log(req.body);
        if( req.body.id && req.body.from, req.body.to ){
            f.check_login(req, function(status){
                if(status == err_code.SUCCESS){
                    accountdb.findOne({id:req.params.id}).exec(function(err, data){
                        if(err) throw err;
                        if(data){
                            var collect = JSON.parse(data.collect);
                            if(collect[req.body.from]){

                                if(collect[req.body.from].length != f.removeA(collect[req.body.from], req.body.id).length){
                                    if(collect[req.body.to]){
                                        collect[req.body.to].push(req.body.id);
                                        data.collect = JSON.stringify(collect);
                                        data.save();
                                        res.end(JSON.stringify({err:err_code.SUCCESS}));
                                    }
                                    else res.end(JSON.stringify({err:err_code.INVALID_OP}));
                                    
                                }
                                else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
                            }
                            else res.end(JSON.stringify({err:err_code.INVALID_OP}));
                        }
                        else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
                    })
                }
                else res.end(JSON.stringify({err:status}));
            })
        }  
        else res.end(JSON.stringify({err:err_code.DATA_INCOM}));
    })
}