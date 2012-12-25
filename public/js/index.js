
$(function(){
var on=0;
var auditspace = Backbone.View.extend({
	el: "body",
	events:{
		"click a.login"	: "open_list",
		"click button#submit" : "log_in",
		"click button#register" : "register",
	},
	open_list:function(){
		if(on) {
			$('.btn-group').removeClass('open');
			on = 0;
		}
		else {
			$('.btn-group').addClass('open');
			$('#email').focus();
			on = 1;
		}
	},
	log_in:function(event){
		event.preventDefault();
		console.log("log_info POST!!");
		var login_obj={email: $('input#email:first').val(), password: $('input#password:first').val()};
		console.log(login_obj);
		$.post('/login',login_obj,function(data){
			var re_status=JSON.parse(data);
			console.log(re_status);
			switch(re_status.err){
				case 0:
					console.log('Log in success');
					setCookie("Banvas_token",re_status.token,100);
					setCookie("Banvas_id",re_status.id,100);
					window.location.replace('/'+re_status.id);	
					break;
				default:
					$('div#sign_in_msg').addClass('alert alert-error').html('Log in failed');
			}
		})

	},
	register:function(event){
		event.preventDefault();
		console.log($('.reg #first').val());
		if($('.reg input#email').val().match(/[\w\+\-\._]+@[\w\-\._]+\.\w{2,}/g)==null)
			$('div#reg_error').addClass('alert alert-error').html('invalid email address!!');
		else if($('.reg #firstname').val().length==0 || $('.reg #lastname').val().length==0)
			$('div#reg_error').addClass('alert alert-error').html('Please fill both First and Last Name!!');
		else if($('.reg #password').val()!==$('.reg #check').val()||$('.reg #password').val().length==0)
			$('div#reg_error').addClass('alert alert-error').html('Password Incorrect');
		else{
			$('div#reg_error').removeClass('alert alert-error').empty();
			var reg_obj = {email: $('.reg input#email').val(), password:$('.reg #password').val() , first_name: $('.reg #firstname').val(), last_name: $('.reg #lastname').val(), id: $('.reg #firstname').val()+$('.reg #lastname').val()};
			console.log(reg_obj);
			$.post('/signup',reg_obj,function(data){
				console.log(data);
				var temp = JSON.parse(data);
				if(temp.err==0)
					$('div#reg_error').addClass('alert alert-success').html('Registration Success.<br>Welcome To Banvas!!<br>check your email box for confirmation url.');
				else if(temp.err==5)
					$('div#reg_error').addClass('alert alert-error').html('The email address or the ID Has Been Used!!');
			});
			$('div#reg_error').empty();
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
					el = $('.slide_container');
					el.html(temp);
					$('.slide_container').css('height','auto');
					$('#index-columns').empty();
					$('input#email').focus();
					$(':password').on('blur', function(){
						//輸入正確
						if( $('.reg #password').val() == $('.reg #check').val() && $('.reg #check').val().length != 0 ){
							$("label[for='check'] i").attr('class','icon-check');
							$('.reg #check').removeClass('warning');
						}
						//輸入錯誤
						else if( $('.reg #password').val() != $('.reg #check').val() && $('.reg #check').val().length != 0 ){
							$("label[for='check'] i").attr('class','icon-check-empty');
							$('.reg #check').addClass('warning');
							console.log('passvalue:'+$('.reg #password').val());
							console.log('checkvalue:'+$('.reg #check').val());
						}
						//未輸入
						else{
							$("label[for='check'] i").attr('class','icon-check-empty');
						}
					});
				}
				, index : function(){
					var temp = _.template($("#index-view").html(),{});
					el = $('.slide_container');
					el.html(temp);
					$('.slide_container').css('height','250px');
					$('.top').show();
					$('.slide button').click(function(){
					    var x = $(this).val();
					    if(x != $('button.focus').val()){
	  			      		$('.slide button.focus').removeClass('focus');
					        $(this).addClass('focus');
					        $('div.top').removeClass('top').hide("slide", {direction: "right"}, 500);
					        $('div.'+x).addClass('top').show("slide",{}, 500);
					    }
					});
					if(getCookie('Banvas_id')){
						$('a.register').html('我的卡片').click(function(){
							window.location = '/'+getCookie('Banvas_id');
						})
						$('a.login').html('登出').removeClass('login').click(function(){
							$.post('/logout',{token:getCookie('Banvas_token')},function(){
								setCookie('Banvas_id','',-10);
								setCookie('Banvas_token','',-10);
								window.location.replace('/');
							})
						})
					}
				}
});
function setCookie(c_name,value,exdays)
{
	var exdate = new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
	document.cookie=c_name + "=" + c_value;
}
function getCookie(c_name){
		var i,x,y,ARRcookies=document.cookie.split(";");
		for (i=0;i<ARRcookies.length;i++)
		{   
				x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
				y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
				x=x.replace(/^\s+|\s+$/g,"");
				if (x==c_name)
				{   
						return unescape(y);
				}   
		}                   
}
new auditspace();
new workspace();
Backbone.history.start();
});
