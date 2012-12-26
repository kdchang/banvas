
/*
 * GET home page.
 */

module.exports = function(app, accountdb){
	app.get('/', function(req, res){
		res.render('index', {title: 'Signup'});
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
		accountdb.findOne({id: req.params.id},{_id:0,__v:0}, function(err,data){
			if(err) throw err;
		
			if(data) 
				res.render('user', {userid: req.params.id,pkt : data,timeline : (data.TimeLine.length==0)?{}: JSON.parse(data.TimeLine)});
			else 
				res.redirect('/');
		});
	});
}
