var mongoose = require('mongoose');

var schema   = new mongoose.Schema({
	username   : {type:String, require:true},
	password   : {type:String, require:true},
	email 	   : {type:String, require:true},
	first_name : {type:String},
	last_name  : {type:String},
	linked     : {type:{Facebook:String, Blogger:String, Linkedin:String}, require:true},
	Position   : {type:String},
	Intro      : {type:String},
        School     : {type:String},
	Skill      : {type:String},
	TimeLine   : {type:String},
	Job_exp    : {type:String},
	Image_pkt  : {type:String},
	user_url   : {type:String},
	phone      : {type:String},
	id         : {type:String}
});

module.exports = mongoose.model('Banvas', schema);
