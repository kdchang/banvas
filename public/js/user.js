var eventnum = 0,i,collect_status=0;
//$("div").qrcode("http://www.google.com.tw");
var Banvas_id = getCookie('Banvas_id'),
	Banvas_token = getCookie('Banvas_token'),
	page_id=$('meta[name="userid"]').attr('content');
var FB_temp = {};
var timeline = {
		"timeline":
		{
				"headline":"Welcome To Banvas",
				"type":"default",
				"text":"Make professional connect easier and closer",
				"startDate":"2000,1,1",
				"date": [{"startDate":"2000,1,1","endDate":"2000,1,30","headline":"Default","text":"<p>Join Banvas</p>","asset":{"media":"","credit":"","caption":""},"my_post_id":0}] 
		}
};

$(document).ready(function(){
	console.log('ready');
	timeline=JSON.parse($('meta[name="timeline_json"]').attr('content'));
	CreateTimeLine();
})
$('.search').click(search);
function search(){
	console.log('search clicked');
	if($('input.search-query').val().length!=0){
		console.log('start searching...');
		$.post('/search',{'token':Banvas_token,'query':$('input.search-query').val()},function(data){
			console.log(data);
		})
	}
}
if(Banvas_id){
if(Banvas_id!=page_id){	//Log in but not the admin of this page
		$(".account").html(Banvas_id).click(function(){
			window.location.replace('/'+Banvas_id);
		});
		$('<button style="float:right;">Add to My Wallet</button>').prependTo('div.person.block').click(function(){
			$.post('/'+Banvas_id+'/collection',{'token': Banvas_token,'id':page_id},function(data){
				console.log(data);
			})	
		});
		$('<button class="btn btn-info" style="float : right;">+1</button>').appendTo('.skill li').click(function(){
			console.log('Like');
		});
}
else{		//admin of the page
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
function edit_mode(){
		$(this).html("Done").removeClass("edit").click(function(){
			save();
			$(this).html("Edit").addClass("edit").unbind('.click');
			$(".static").unbind('click');
			$('.temp').remove();
			var skill_temp=[];
			$('.skill p').each(function(){skill_temp.push($(this).html())});
			var post_data = {"token": Banvas_token,"School": $('.school:first').html(),"Intro":$('.intro').html(),"Skill":skill_temp,"Position":$('.position:first').html(),"linked":{"Facebook":$('a.FB').attr('href'),"Blogger":'#',"Linkedin":'#'},"TimeLine":JSON.stringify(timeline)}; $.post('/'+Banvas_id+'/modify',post_data,function(data){
				console.log(data);
			});
			console.log('Posting new data....');
			console.log(post_data);
			$(this).unbind('click').bind('click',edit_mode);
		});
		$(".static").click(edit).change(save).end();
		$('<button class="temp head_change">+</button>').insertAfter('img.head').click(function(){
			$("<form method='post' action='/"+Banvas_id+"/mod_img' ENCTYPE=\"multipart/form-data\"><input type='file' name='file' /><input name='token' type='hidden' value='"+Banvas_token+"'/><input type='hidden' name='title' value='head'/> <button>送出</button></form>").dialog();
});
		$('<button class="temp" style="float : right;">-</button>').appendTo('.skill li').click(function(event){
			event.stopPropagation();
			$(this).parent('li').remove();
		});
		$('<button class="temp">+</button>').appendTo('.skill_header').click(function(){
			$('<li><p class="changing"><input autofocus="autofocus" class=\"editing\" type="text" value="default"></p></li>').appendTo('ul.skill').children('p').bind('focusout',save);
		});
		$('<button class="temp" style="float : right;">Add Social Network Link</button>').appendTo('div.social').click(Social_url);
		$('<button class="temp" >Add Timeline Event</button>').insertAfter('div#timeline').click(AddTimeEvent);
		$('<button class="temp" >Timeline Config</button>').insertAfter('div#timeline').click(Timeline_config);
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
/*function setCookie(c_name,value,exdays){
    var exdate = new Date();
	exdate.setDate(exdate.getDate() + exdays);
    var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
	document.cookie=c_name + "=" + c_value;
}*/
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
	var contain_temp;

	if(collect_status){
		$('div.container').empty().append(contain_temp);
		collect_status = 0;
	}
	else{
		contain_temp = $('div.container').html();
		$('div.container').empty().append($('#collection_list').html());
		$.post('/'+Banvas_id+'/collection_list',function(data){
			console.log(data);
		});
		collect_status = 1;
	}
}
function show_card(){
	var b_card = $('#b_card').html();
	$.fancybox.open($('<div></div>').qrcode(document.URL).append(b_card),{
		afterLoad : function(){
			console.log('3');
			$(".static").click(edit).change(save).end();
		}
	});
}
}
}
