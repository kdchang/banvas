var i,
	collect_status=0,
	search_status=0,
	contain_temp,
	collect_temp,
	b_card_temp,
	front=1,
	account_status=0;
	skill_temp=[];
var Banvas_id = getCookie('Banvas_id'),
	Banvas_token = getCookie('Banvas_token'),
	page_id=$('meta[name="userid"]').attr('content');
var FB_temp = {};
var timeline;
$(document).ready(function(){
	timeline=JSON.parse($('meta[name="timeline_json"]').attr('content'));
	CreateTimeLine();
	b_card_temp=$('meta[name="b_card"]').attr('content');
})
$('.company').each(function(){
	$.post('/pic_url', {pic: $(this).html()}, function(data){
		console.log(data);
		$(this).prev().attr('src',data);
	});
});
$('ul.account').mouseleave(function(){
	$(this).hide();
	account_status=0;
});
$('.search').click(search);
function search(event){
	event.preventDefault();
	console.log('search clicked');
	if($('input.search-query').val().length!=0){
		console.log('start searching...');
		$.post('/search',{'token':Banvas_token,'query':$('input.search-query').val()},function(res){
			if(!search_status){
				collect_temp = $('div.main').html();
				search_status = 1;
			}
			$('div.main').empty();
			var search_list= JSON.parse(res).data;
			for(var i=0; i < search_list.length ; i++){
				console.log(search_list[i]);
				$('div.main').append('<div class="block"><a href="/'+search_list[i].id+'">'+search_list[i].name.first+' '+search_list[i].name.last+'</a></div>');
			}
		})
	}
}
console.log($('.skill p'));
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
if(Banvas_id){
if(Banvas_id!=page_id){	//Log in but not the admin of this page
		$(".acc_btn").html(Banvas_id).click(function(){
			window.location.replace('/'+Banvas_id);
		});
		$('<button style="position:absolute; right: 5%;">Add to My Wallet</button>').prependTo('div.person.block').click(function(){
			$.post('/'+Banvas_id+'/collection',{'token': Banvas_token,'id':page_id},function(data){
				console.log(data);
			})	
		});
		$('<button class="btn btn-info" style="float : right;">+1</button>').appendTo('.skill li').click(function(){
			var icon;
			$.post('/'+Banvas_id+'/status',function(res){
				var state= JSON.parse(res).data;
				console.log(JSON.parse(state.Image_pkt).head_url);
				icon= $('<img class="icon social" src="/uploads/'+JSON.parse(state.Image_pkt).head_url+'">');
				console.log('test');
			})
			$(this).append(icon);
		});
}
else{		//admin of the page
$('.acc_btn').click(function(){
	if(account_status){
		$('ul.account').hide();
		account_status=0;
	}
	else{
		$('ul.account').show();
		account_status=1;
	}
	
});
$(".edit").click(edit_mode);
$('.logout').click(function(){
	$.post('/logout',{'token': Banvas_token},function(){
		document.cookie='Banvas_id=;expires=Thu, 01-Jan-1970 00:00:01 GMT'
		document.cookie='Banvas_token=;expires=Thu, 01-Jan-1970 00:00:01 GMT'
		window.location.replace('/');
	});
});
$(".collect").click(Show_collection);
$(".FB_import").click(FB_import);
$('.B_card').click(show_card);
// Function Area
function edit_mode(event){
		event.preventDefault();
		$(this).html("儲存").removeClass("edit").click(function(){
			save();
			$(this).html("編輯").addClass("edit").unbind('.click');
			$(".static").unbind('click');
			$('.temp').remove();
			$('.skill p').each(function(){
				$.post('/'+Banvas_id+'/skill/add',{'token':Banvas_token,'skill':$(this).html()},function(data){
					console.log(data);
				});
			});
			$('.resume p').each(function(){
				$.post('/'+Banvas_id+'/resume/add',{'token':Banvas_token,'skill':$(this).html()},function(data){	
					cosole.log(data);
				});
			});
			var name={"first":$('.first').html(),"last":$('.last').html()};
			var post_data = {"token": Banvas_token,"name": name,"About_me":$('.intro').html(),"linked":{"Facebook":$('a.FB').attr('href'),"Blogger":'#',"Linkedin":'#'},"TimeLine":JSON.stringify(timeline)}; 
			$.post('/'+Banvas_id+'/modify',post_data,function(data){
				console.log(data);
			});
			console.log(post_data);
			$(this).unbind('click').bind('click',edit_mode);
		});
		if($('.school.static').length==0){
			$('<br><span>公司：</span><p class="school changing"></p>').appendTo('span.id');
			$('<input autofocus="autofocus" class="editing" type="text" placeholder="公司">').appendTo('p.school').bind('focusout',save);
		}
		if($('.intro.static').length==0){
			$('<br><span>關於我：</span><p class="intro changing"></p>').appendTo('span.id');
			$('<input autofocus="autofocus" class="editing" type="text" placeholder="關於我">').appendTo('p.intro').bind('focusout',save);
		}
		$(".static").click(edit).change(save).end();
		$('<button class="temp head_change btn btn-info">+</button>').insertAfter('img.head').click(function(){
			$("<form method='post' action='/"+Banvas_id+"/mod_img' ENCTYPE=\"multipart/form-data\"><input type='file' name='file' /><input name='token' type='hidden' value='"+Banvas_token+"'/><input type='hidden' name='title' value='head'/> <button>送出</button></form>").dialog();
});
		$('<button class="temp btn btn-info" style="float : right;">-</button>').appendTo('.skill li').click(function(event){
			event.stopPropagation();
			$(this).parent('li').remove();
		});
		$('<button class="temp btn btn-info">+</button>').appendTo('.resume_header').click(function(){
			$('<li><p class="changing"><input autofocus="autofocus" class=\"editing\" type="text" value="default"></p></li>').appendTo('ul.resume').children('p').bind('focusout',save);
		});
		$('<button class="temp btn btn-info" style="float : right;">Add Social Network Link</button>').appendTo('div.social').click(Social_url);
		$('<button class="temp btn btn-info">+</button>').appendTo('.skill_header').click(function(){
			$('<li><p class="changing"><input autofocus="autofocus" class=\"editing\" type="text" value="default"></p></li>').appendTo('ul.skill').children('p').bind('focusout',save);
		});
		$('<button class="temp btn btn-info" style="margin: 5px;" >Add Timeline Event</button>').insertAfter('div#timeline').click(AddTimeEvent);
		$('<button class="temp btn btn-info" style="margin: 5px;" >Timeline Config</button>').insertAfter('div#timeline').click(Timeline_config);
};
function save(){
			$(".editing").each(function(){
				var temp=$(this).val();
				$(this).parent(".changing").removeClass("changing").addClass("static").unbind('click').bind('click',edit).html(temp);
			});
}
function edit(){
			console.log('edit');
			temp=$(this).removeClass("static").addClass("changing").html();
			$(this).html('<input autofocus="autofocus" class=\"editing\" type="text" value=\''+temp+'\'>').unbind('click').bind('focusout',save);
}
function Social_url(){
	$("<form><label>Facebook:</label><input type='text' id='FB_url'/><br><label>Blog:</label><input type='text' id='Blog_url'/><br><label>LinkedIn:</label><input type='text' id='Linked_url'/></form>").dialog({
		buttons: {
			"Set": function(){
				$('a.FB').attr('href',$('#FB_url').val());
				$( this ).dialog( "close" );
			},
			"Cancel": function(){
				$( this ).dialog( "close" );
				}
		}
	});
}
function AddTimeEvent(){
	var temp = _.template($('#add_time_form').html(),{});
	$(temp).dialog({
		height: 600,
		width: 400,
		modal: true,
		buttons : {
			"Create": function(){
				var new_event={
					"startDate": $('#startDate:last').val() || '1991,1,1',
					"endDate": $('#endDate:last').val() || '1991,1,2',
					"headline":$('#headline:last').val() || 'default',
					"text": '<p>'+($('#text:last').val() || 'default')+'</p>',
					"asset":{
						"media":$('#url').val() || " ",
						"credit":" ",
						"caption":" "
					}
				}
				console.log(new_event);
				timeline.timeline.date.push(new_event);
				$('#timeline-embed').empty();
				CreateTimeLine();
				$( this ).dialog("destroy").remove();
			},
			"Cancel": function(){
				$( this ).dialog( "destroy" ).remove();
			}
		}
	});
	$('#startDate:last').datepicker();
	$('#endDate:last').datepicker();
}
function Timeline_config(){
	var temp = _.template($('#Timeline_config').html(),{});
	$(temp).dialog({
		height: 600,
		width: 400,
		modal: true,
		buttons : {
			"Update": function(){
				if($('#headname').val()!='')
					timeline.timeline.headline=$('#headname').val();
				if($('#time_des').val()!='')
					timeline.timeline.text=$('#time_des').val();
				if($('#time_start').val()!='')
					timeline.timeline.startDate=$('#time_start').val();
				$('#timeline-embed').empty();
				CreateTimeLine();
				$( this ).dialog( "destroy" ).remove();
			},
			"Cancel": function(){
				$( this ).dialog( "destroy" ).remove();
			}
		}
	});
}
function CreateTimeLine(){
	console.log(timeline);	
	createStoryJS({
		type:       'timeline',
		width:      '100%',
		height:     '400',
		source:     timeline,
		embed_id:   'timeline-embed',           // ID of the DIV you want to load the timeline into
	});	
}
window.fbAsyncInit = function() {
		FB.init({
	appId      : '471817496195401', // App ID from the App Dashboard
	channelUrl : '//WWW.YOUR_DOMAIN.COM/channel.html', // Channel File for x-domain communication
	status     : true, // check the login status upon init?
	cookie     : true, // set sessions cookies to allow your server to access the session?
	xfbml      : true  // parse XFBML tags on this page?
});
};

(function(d, debug){
	var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
	if (d.getElementById(id)) {return;}
	js = d.createElement('script'); js.id = id; js.async = true;
	js.src = "//connect.facebook.net/en_US/all" + (debug ? "/debug" : "") + ".js";
	ref.parentNode.insertBefore(js, ref);
}(document, /*debug*/ false));

function FB_import(){
	FB.login(function(response) {
		if (response.authResponse) {
			console.log('Welcome!  Fetching your information.... ');
			FB.api('/me?fields=bio,birthday,education,work', function(response) {
				for (i in response['education']){
					if( response['education'][i]['type'] == 'College' || response['education'][i]['type'] == 'Graduate School' ){
						FB_temp['School'] = response['education'][i]['school']['name'];
					}
				}
				if(response['work']) FB_temp['Job_exp'] = JSON.stringify(response['work'][0]);
				FB_temp['token']=Banvas_token;
				console.log(FB_temp);
				$.post('/'+Banvas_id+'/modify', FB_temp, function(message){
					console.log(message);
				})
				window.location.replace('/user');
			});
		} else console.log('User cancelled login or did not fully authorize.');
	});
}
function Show_collection(){

	if(collect_status){
		$('div.main').empty().append(contain_temp);
		collect_status = 0;
	}
	else{
		contain_temp = $('div.main').html();
		$('div.main').empty().append($('#collection_list').html());
		$.post('/'+Banvas_id+'/collection_list',function(data){
			console.log(data);
		});
		collect_status = 1;
	}
}
function show_card(event){
	event.preventDefault();
	var b_card = $('#b_card').html();
	var edit_status=1;
	//$(b_card).qrcode(document.URL);
	$.fancybox.open($('<div id="drag-bound" style="width:600px;height:366px;background-image:url(/material/card-front.png);"></div>').append(b_card),{
		afterShow : function(){
			$('.qr_container').qrcode({render:'table',width:200,height:200,text:document.URL});
		//	if(b_card_temp.length!=0)
		//		$('div#drag-bound').html(b_card_temp);
			$('#back').click(function(){
				if(front){
					b_card_temp=$('.b_card_content').html();
					$('.b_card_content').empty();
					$('.qr_container').empty();
					front=0;
				}
			});
			$('#front').click(function(){
				if(!front){
					$('.qr_container').qrcode({width:200,height:200,text:document.URL});
					$('.b_card_content').append(b_card_temp);
					front=1;
				}
			});
			$('#edit_b').click(function(){
				if(edit_status){
					$(".static").click(edit).change(save).end();
					$(".drag").draggable({ containment: "#drag-bound" }).css('cursor','move');
					$("canvas").draggable({ containment: "#drag-bound" });
					$(this).html("儲存");
					edit_status=0;
				}else{
					$(".static").unbind('click');
					$(".drag").draggable('destroy').css('cursor','');
					$("canvas").draggable('destroy');
					/*html2canvas($('div#drag-bound'),{
						onrendered: function( canvas ) {
							console.log('test');
							canvas.appendTo('div#drag-bound');
						}
					});*/
					$.post('./'+Banvas_id+'/modify',{token:Banvas_token,Job_exp:$('div#drag-bound').html()},function(data){
						console.log(data);
					});
					var canvas=$('#canvas:first');
					canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
					rasterizeHTML.drawHTML($('#drag-bound').html(),canvas);
					$(this).html("編輯");
					edit_status=1;
				}
			});
			$('#close').click(function(){
				$.fancybox.close();
			});
		}
	});
}
}
}
else{	//the user haven't login
	
	$('.function').remove();
	$(document).ready(function(){
		var login_list=$('#log_in').html();
		$(".acc_btn").after(login_list);
		$('ul.account').click(function(event){event.stopPropagation();});
		$(".acc_btn").html('Login').click(function(event){
			if(account_status){
				$('ul.account').hide();
				account_status=0;
			}
			else{
				$('ul.account').show();
				account_status=1;
			}
		});
		$('#submit').click(function(event){
					event.preventDefault();
					var login_obj={email: $('input#email:first').val(), password: $('input#password:first').val()};
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
					});
		});
	});
}
