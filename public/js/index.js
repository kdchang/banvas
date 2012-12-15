$(function(){
var auditspace = Backbone.View.extend({
	el: "body",
	events:{
		"click input#submit" : "log_in",
		"click input#register" : "register"
	},
	log_in:function(event){
		event.preventDefault();
		console.log("log_info POST!!");
		var login_obj={email: $('input#email:first').val(), password: $('input#password:first').val()};
		console.log(login_obj);
		$.post('/login',login_obj,function(data){
			console.log(data);
		})
	},
	register:function(event){
		event.preventDefault();
		console.log("Reg_info POST");
		if($('#reg_pass').val()!=$('#con_pass').val())
			$('.reg div#error').html('password unmatched!!');
		else{
			var reg_obj = {email: $('.reg input#email').val(), password:$('#reg_pass').val() , first_name: $('#first').val(), last_name: $('#last').val(), id: $('#id').val()};
			console.log(reg_obj);
			$.post('/signup',reg_obj,function(data){
				console.log(data);
			});
			$('.reg div#error').empty();
		}
	}
});
var workspace = Backbone.Router.extend({	
    			routes :{
					'register' : 'register',
					'index' : 'index',
					'': 'index'
    			}
    			, register : function() {
				var temp = _.template($("#register-view").html(),{});
					el = $('.container');
					el.html(temp);
				}
				, index : function(){
				var temp = _.template($("#index-view").html(),{});
					el = $('.container');
					el.html(temp);
					$('.top').show();
					$('button').click(function(){
				    var x = $(this).val();
				    if(x != $('button.focus').val()){
  			      	$('button.focus').removeClass('focus');
			        $(this).addClass('focus');
			        $('div.top').removeClass('top').hide("slide", {direction: "right"}, 500);
			        $('div.'+x).addClass('top').show("slide",{}, 500);
				    }
					});
				}
});
new auditspace();
new workspace();
Backbone.history.start();
});
