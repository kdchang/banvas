
/*
 * GET home page.
 */

module.exports = function(app){
	app.get('/', function(req, res){
		res.render('index', {title: 'Signup'});
	});
	app.get('/user', function(req, res){
		res.render('user', {title: 'Signup', head_url: 'default'});
	});
	app.get('/login', function(req, res){
		res.redirect('test');
	});
	app.get('/test', function(req, res){
		res.render('test', {title:'test'});
	});
}