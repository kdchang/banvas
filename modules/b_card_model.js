var mongoose = require('mongoose');

var schema   = new mongoose.Schema({
    password     : {type:String, require:true, select:false},
    email        : {type:String, require:true, unique: true},
    name         : {
    	first: {type:String, require:true},
    	last : {type:String, require:true}
    },
    id           : {type:String, require:true, unique: true},
    linked       : {type:{Facebook:String, Blogger:String, Linkedin:String}, require:true},
    Position     : {type:String},
    Intro        : {type:String},
    School       : {type:String},
    Skill        : {type:String},
    TimeLine     : {type:String},
    Job_exp      : {type:String},
    Image_pkt    : {type:String},
    phone        : {type:String},
    modify_date  : {type:Date, default: Date.now },
    register_date: {type:Date},
    statistic    : {type:Number},
    collect      : {type:String},
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

schema.methods.find = function(req, callback){
    console.log(req);
    return this.model('B_Card').findOne(req, {'_id':0, '__v':0}, callback);
}

schema.methods.findAll = function(req, callback){
    console.log(req);
    return this.model('B_Card').find(req, {_id:0, __v:0}, callback);
}

module.exports = mongoose.model('B_Card', schema);
