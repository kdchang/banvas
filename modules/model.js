var mongoose = require('mongoose');

var schema   = new mongoose.Schema({
    password     : {type:String, require:true, select:false},
    email        : {type:String, require:true, unique: true},
    name         : {
    	first: {type:String, require:true},
    	last : {type:String, require:true}
    },
    id           : {type:String, require:true},
    linked       : {type:{Facebook:String, Blogger:String, Linkedin:String}, require:true, default: {Facebook:"#",Blogger:"#",Linkedin:"#"}},
    Position     : {type:String, default:"default"},
    Intro        : {type:String, default:"default"},
    School       : {type:String, default:"default"},
    Skill        : {type:Array, default:[]},
    TimeLine     : {type:String, default:"default"},
    Job_exp      : {type:String, default:"default"},
    Image_pkt    : {type:String, default:'{"head_url":"default.png"}'},
    phone        : {type:String, default:"default"},
    modify_date  : {type:Date, default: Date.now },
    register_date: {type:Date},
    Location     : {type:String},
    statistic    : {
        // how many people queried your status before
        view_time: {type:Number, default:0},
    },
    collect      : {type:String, select:false},
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
