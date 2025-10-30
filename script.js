
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

// Filter Modal Functionality
var selectedCategory = null;

// Open filter modal
$("#filter-button, #filter-menu").click(function() {
    $("#filter-modal").removeClass("hidden");
});

// Close filter modal
$("#close-filter").click(function() {
    $("#filter-modal").addClass("hidden");
});

// Close modal when clicking outside
$("#filter-modal").click(function(e) {
    if ($(e.target).attr("id") === "filter-modal") {
        $("#filter-modal").addClass("hidden");
    }
});

// Category selection
$(".category-btn").click(function() {
    // Remove active state from all buttons
    $(".category-btn").removeClass("bg-blue-500 text-white").addClass("bg-gray-100 text-gray-700");
    
    // Add active state to clicked button
    $(this).removeClass("bg-gray-100 text-gray-700").addClass("bg-blue-500 text-white");
    
    // Store selected category
    selectedCategory = $(this).data("category");
});

// Apply filter
$("#apply-filter").click(function() {
    // Close modal
    $("#filter-modal").addClass("hidden");
});

// Clear filter
$("#clear-filter").click(function() {
    // Reset category selection
    selectedCategory = null;
    
    // Reset button styles
    $(".category-btn").removeClass("bg-blue-500 text-white").addClass("bg-gray-100 text-gray-700");
    
    // Show all products
    $(".product-card").show();
});