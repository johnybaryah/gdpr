//alert("js2 loaded");
$("#btn2").on("click", function(){ alert("show alert for button 2"); });

$(document).on("mousemove", function(e){
    console.log(e);
    $(".moveMe").show();
    $(".moveMe").css("width","400px");
    $(".moveMe").offset({top: e.pageY, left: e.pageX});
})