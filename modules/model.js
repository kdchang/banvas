var mongoose = require('mongoose');

var schema   = new mongoose.Schema({
	password   : {type:String, require:true},
	email 	   : {type:String, require:true},
	first_name : {type:String, require:true},
	last_name  : {type:String, require:true},
	id         : {type:String, require:true},
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
});

module.exports = mongoose.model('Banvas', schema);
