var mongoose = require('mongoose');

var schema   = new mongoose.Schema({
    password     : {type:String, require:true, select:false},
    email        : {type:String, require:true, unique: true},
    name         : {
    	first: {type:String, require:true},
    	last : {type:String, require:true}
    },
    id           : {type:String, require:true},
    linked       : {
        Facebook: {type:String, default:""},
        Blogger: {type:String, default:""},
        Linkedin: {type:String, default:""}
    },
    About_me     : {type:String, default:""},
    
    TimeLine     : {type:String, default:""},
    Job_exp      : {type:String, default:""},
    Image_pkt    : {
        picture: {type:String, default:"default.png"},
        pictureSmall: {type:String, default:"default.png"}
    },
    phone        : {type:String, default:""},
    modify_date  : {type:Date, default: Date.now },
    register_date: {type:Date},
    statistic    : {
        view_time: {type:Number, default:0},
        collect_time: {type:Number, default:0}
    },
    resume       : {type:String, default: "[]"},
    Skill        : {type:String, default: "{}"},
    collect      : {type:String, default: "{}"}
},{
    _id: false
});

schema.virtual('name.full').get(function(){
	return this.name.first + ' ' + this.name.last;
})

schema.virtual('name.full').set(function(name){
	var split = name.split(' ');
	this.name.first = split[0];
	this.name.last = split[1];
})

schema.virtual('first_name').set(function(name){
	this.name.first = name;
})

schema.virtual('last_name').set(function(name){
	this.name.last = name;
})

module.exports = mongoose.model('Banvas', schema);
