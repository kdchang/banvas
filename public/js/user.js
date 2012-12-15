var eventnum = 0,i;
var scrollbar = $('.scroller').slider({
	slide: function( event, ui ) {
	    console.log("test");
	}
});
//$("div").qrcode("http://www.google.com.t<F5>w");
$(".edit").click(edit_mode);
function edit_mode(){
		$(this).html("Done").removeClass("edit").click(function(){
			save();
			$(this).html("Edit").addClass("edit");
			$(".static").unbind('click');
			$(".edit").bind('click',edit_mode);
		});
		$(".static").click(edit).change(save).end();
		scrollbar.unbind('slide');
		scrollbar.bind('slide',function( event, ui ) {
	    			console.log("test2");
	   	});
}
$('#scroll-right').on('mouseup mouseleave',function(){
	window.clearInterval(i);
}).mousedown(function(){
	var temp = $('.ui-slider').css('left');
	i = window.setInterval(function() {$('.ui-slider').css('left','+=10')}, 100);
});
$('#scroll-left').on('mouseup mouseleave',function(){
	window.clearInterval(i);
}).mousedown(function(){
	var temp = $('.ui-slider').css('left');
	i = window.setInterval(function() {$('.ui-slider').css('left','-=10')}, 100);
});

function save(){
			$(".editing").each(function(){
				var temp=$(this).val();
				$(this).parent(".changing").removeClass("changing").addClass("static").unbind('click').bind('click',edit).html(temp);
			});
}
function edit(){
			temp=$(this).removeClass("static").addClass("changing").html();
			$(this).html('<input class=\"editing\" type="text" value=\''+temp+'\'>').unbind('click').bind('click',save);
}

