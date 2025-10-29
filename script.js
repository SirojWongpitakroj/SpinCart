
//Hamburger DropDown Animation
$("#hamburger-menu").click(function() {
    $("#dropdown-menu").toggle();
});

//Product Cards link to Product Page
$(".cards").click(function() {
    window.location.href = "./product.html";
});

//Slicing Long Text
var longText = $(".long-text").text();
var screenWidth = $(window).width();
if (longText.length > 150 && screenWidth < 800) {
    $(".long-text").text(longText.slice(0,150) + " . . . ");
}