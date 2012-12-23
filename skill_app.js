var err_code = require('./err');
var f = require('./function');

module.exports = function(app, accountdb){
    app.post("/:id/skill/add", function(req, res){
        console.log(req.body);
        f.login_and_find(req, res, accountdb, function(data){
            var skill = JSON.parse(data.Skill);
            if( !skill[req.body.skill] ){
                skill[req.body.skill] = [];
            }
            data.Skill = JSON.stringify(skill);
            data.save();
            res.end(JSON.stringify({err:err_code.SUCCESS}));
        })
    });

    app.post("/:id/skill/list", function(req, res){
        console.log(req.body);
        f.login_and_find(req, res, accountdb, function(data){
            res.end(JSON.stringify({err:err_code.SUCCESS, data:JSON.parse(data.Skill)}));
        })
    });

    app.post("/:id/skill/delete", function(req, res){
        console.log(req.body);
        f.login_and_find(req, res, accountdb, function(data){
            var skill = JSON.parse(data.Skill);
            delete skill[req.body.skill];
            data.Skill = JSON.stringify(skill);
            data.save();
            res.end(JSON.stringify({err:err_code.SUCCESS}));
        })
    });

    app.post("/:id/skill/approve", function(req, res){
        console.log(req.body);
        f.check_login(req, function(status){
            if(status == err_code.PERMISSION_DENIED){
                accountdb.findOne({id:req.params.id}).exec(function(err,data){
                    if(err) throw err;
                    if(data){
                        var skill = JSON.parse(data.Skill);
                        if( skill[req.body.skill] && skill[req.body.skill].indexOf(req.session.item.log_data.id)<0 ){
                            skill[req.body.skill].push( req.session.item.log_data.id );
                            data.Skill = JSON.stringify(skill);
                            data.save();
                        }
                        res.end(JSON.stringify({err:err_code.SUCCESS}));
                    }
                    else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
                })
            }
            else if(status == err_code.SUCCESS)res.end(JSON.stringify({err:err_code.PERMISSION_DENIED}));
            else res.end(JSON.stringify({err:status}));
        })
    });

    app.post("/:id/skill/deapprove", function(req, res){
        console.log(req.body);
        f.check_login(req, function(status){
            if(status == err_code.PERMISSION_DENIED){
                accountdb.findOne({id:req.params.id}).exec(function(err,data){
                    if(err) throw err;
                    if(data){
                        var skill = JSON.parse(data.Skill);
                        f.removeA( skill[req.body.skill], req.session.item.log_data.id );
                        data.Skill = JSON.stringify(skill);
                        data.save();
                        res.end(JSON.stringify({err:err_code.SUCCESS}));
                    }
                    else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
                });
            }
            else if(status == err_code.SUCCESS)res.end(JSON.stringify({err:err_code.PERMISSION_DENIED}));
            else res.end(JSON.stringify({err:status}));
        });
    });
}