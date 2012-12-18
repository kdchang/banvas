
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
		res.render('user', {title: 'Signup', head_url: 'default',userid: req.params.id});
	});
}
