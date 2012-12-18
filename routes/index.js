
/*
 * GET home page.
 */

module.exports = function(app, accountdb){
	app.get('/', function(req, res){
		res.render('index', {title: 'Signup'});
	});
	app.get('/login', function(req, res){
		res.redirect('test');
	});
	app.get('/test', function(req, res){
		res.render('test', {title:'test'});
	});
	app.get('/:id', function(req, res){
		accountdb.findOne({id: req.params.id},{_id:0,__v:0}, function(err,data){
		if(err) throw err;
		console.log(data.TimeLine);
		if(data) res.render('user', {userid: req.params.id,pkt : data,timeline : (data.TimeLine=='default')?{}: JSON.parse(data.TimeLine)});
		else res.render('No Such User');
		});
	});
}
