
/*
 * GET home page.
 */

exports.index = function(req, res){
	res.render('index', { title: 'Signup' });
};

exports.login = function(req, res){
  res.render('login', { title: 'login' });
};

exports.test = function(req, res){
	res.render('test');
}