
/*
 * GET home page.
 */

module.exports = function(app, accountdb){
	app.get('/', function(req, res){
		if(req.session.item && req.session.item.log_data){
			accountdb.findOne({id: req.session.item.log_data.id}, function(err, data){
				if(err) throw err;
				if(data){
					res.redirect('/'+req.session.item.log_data.id);
				}
				else{
					req.session.item = {};
					res.redirect('/');
				} 
			})
		}
		else res.render('index', {title: 'Signup'});
	});
	app.get('/test', function(req, res){
		res.render('test', {title:'test'});
	});

	app.get('/signup', function(req, res){
        res.render('signup',{});
    })

    app.get('/signin', function(req, res){
        res.render('signin',{});
    })

    app.get('/detail', function(req, res){
        res.render('detail',{});
    })

    app.get('/search', function(req, res){
    	res.render('search',{});
    })

    app.get('/:id', function(req, res){
		accountdb.findOne({id: req.params.id}, function(err,data){
			if(err) throw err;
			if(data){
				data.statistic.view_time = data.statistic.view_time + 1;
				data.save();
				res.render('user', {userid: req.params.id, pkt: data, timeline: (data.TimeLine.length==0)?{}:JSON.parse(data.TimeLine)});
			}
			else 
				res.redirect('/');
		});
	});
}
