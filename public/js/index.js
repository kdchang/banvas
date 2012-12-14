$(function(){
console.log('hi');
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
new workspace();
Backbone.history.start();
});
