
/*
 * GET home page.
 */

exports.index = function(req, res){
	res.render('index.ejs', { layout: false, title: 'Signup' });
};
exports.user = function(req, res){
	res.render('user.ejs', { layout: false, title: 'Signup',head_url: 'default' });
};
exports.login= function(req, res){
	res.render('login');
}
exports.test = function(req, res){
	res.render('test', {title: 'login'});
}
exports.facebook = function(req, res){
	res.render('facebook');
}
