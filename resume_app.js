var err_code = require('./err');
var f = require('./function');

module.exports = function(app, accountdb){
    app.post('/:id/resume/add', function(req, res){
        console.log(req.body);
        if(req.body.resume){
            f.check_login(req, function(status){
                if(status==err_code.SUCCESS){
                    accountdb.findOne({id:req.params.id}).exec(function(err, data){
                        if(err) throw err;
                        if(data){
                            var resume = {};

                            resume.Company = req.body.resume.Company?req.bdoy.resume.Company:"";
                            resume.Position = req.body.resume.Position?req.body.resume.Positon:"";
                            resume.Department = req.body.resume.Department?req.body.resume.Department:"";

                            var user_resume = JSON.parse(data.resume);
                            user_resume.push(resume);
                            data.resume = JSON.stringify(user_resume);
                            data.save();
                            res.end(JSON.stringify({err:err_code.SUCCESS}));
                        }
                        else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
                    });
                }
                else res.end(JSON.stringify({err:status}));
            });
        }
        else res.end(JSON.stringify({err:err_code.DATA_INCOM}));
    });

    app.post('/:id/resume/list', function(req, res){
        console.log(req.body);
        f.check_login(req, function(status){
            if(status == err_code.SUCCESS){
                accountdb.findOne({id:req.params.id}).exec(function(err, data){
                    if(err) throw err;
                    if(data){
                        console.log(data.resume);
                        var resume = JSON.parse(data.resume);
                        res.end(JSON.stringify({err:err_code.SUCCESS, data:resume}));
                    }
                    else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
                })
            }
            else res.end(JSON.stringify({err:status}));
        })
    });

    app.post('/:id/resume/delete', function(req, res){
        console.log(req.body);
        f.check_login(req, function(status){
            if(status==err_code.SUCCESS){
                accountdb.findOne({id:req.params.id}).exec(function(err, data){
                    if(err) throw err;
                    if(data){
                        var resume = JSON.parse(data.resume);
                        var resume2 = [];
                        for (i in resume){
                            if(JSON.stringify(resume[i]) != JSON.stringify(req.body.resume)){
                                resume2.push(resume[i]);
                            }
                        }
                        data.resume = JSON.stringify(resume2);
                        data.save();
                        res.end(JSON.stringify({err:err_code.SUCCESS}));
                    }
                    else res.end(JSON.stringify({err:err_code.USER_FIND_ERROR}));
                })
            }
            else res.end(JSON.stringify({err:status}));
        })
    });
}