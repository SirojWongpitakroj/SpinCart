//Hamburger DropDown Animation
$("#hamburger-menu").click(function() {
    $("#dropdown-menu").toggle();
});

//Slicing Long Text
var longText = $(".long-text").text();
var screenWidth = $(window).width();
if (longText.length > 150 && screenWidth < 800) {
    $(".long-text").text(longText.slice(0,150) + " . . . ");
}


$(".quantity-btn").each(function (index, button) {
    $(button).click(function () {
        const input = this.parentElement.querySelector(".quantity-input");
        const action = this.getAttribute("data-quantity-action");
        let currentValue = parseInt(input.value, 10) || 1;

        if (action === "increment") {
            input.value = currentValue + 1;
        } else if (action === "decrement" && currentValue > 1) {
            input.value = currentValue - 1;
        }
    });
});

// Filter Modal Functionality
let selectedCategory = $("#filter-modal").data("selected-category") || null;

function highlightSelectedCategory(category) {
    $(".category-btn")
        .removeClass("bg-blue-500 text-white")
        .addClass("bg-gray-100 text-gray-700");

    if (!category) return;

    $(`.category-btn[data-category="${category}"]`)
        .removeClass("bg-gray-100 text-gray-700")
        .addClass("bg-blue-500 text-white");
}

highlightSelectedCategory(selectedCategory);

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
    selectedCategory = $(this).data("category");
    highlightSelectedCategory(selectedCategory);
});

// Apply filter
$("#apply-filter").click(function() {
    // Close modal
    $("#filter-modal").addClass("hidden");

    axios.post("/filter/apply", { category: selectedCategory })
        .then(() => {
            window.location.href = "/";
        })
        .catch((err) => {
            console.error(err);
        });
});

// Clear filter
$("#clear-filter").click(function() {
    // Reset category selection
    selectedCategory = null;
    
    // Reset button styles
    $(".category-btn").removeClass("bg-blue-500 text-white").addClass("bg-gray-100 text-gray-700");
    
    // Show all products
    $(".product-card").show();

    axios.post("/filter/apply", { category: null })
        .then(() => {
            window.location.href = "/";
        })
        .catch((err) => {
            console.error(err);
        });
});

//Handle Dismiss button

$("#dismiss-error").click(function() {
    $("#error-overlay").addClass("hidden");
});

//debouncing
const debouncedSendQtyUpdate = debounce(sendQtyUpdate, 500);

$(".qty-btn").click(async function() {

    const item_id = this.dataset.itemId;
    const unit_price = parseFloat(this.dataset.price);
    const subtotal = parseFloat($("#subtotal").text().slice(1));
    const $input = $(this).siblings(".quantity-input");
    let qty = parseInt($input.val());

    //qty Update
    let sum;
    if (this.dataset.quantityAction === "increment") {
        qty++;
        sum = subtotal + unit_price;
    } else if(this.dataset.quantityAction === "decrement" && qty > 1) {
        qty--;
        sum = subtotal - unit_price;

    }else {
        return
    }

    $input.val(qty);

    //subtotal and total update
    $("#subtotal").text("฿" + sum);
    $("#total").text("฿" + (sum + 100));

    debouncedSendQtyUpdate(item_id, qty);
});

function debounce(func, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

async function sendQtyUpdate(item_id, qty) {
    try {
        const response = await fetch("/cart/qtyUpdate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ item_id, qty })
        });
    } catch(err) {
        console.error(err);
    }
}

//delete cart_item
$(".remove-btn").click(async function() {
    $button = $(this);
    const item_id = $button.data("itemId");
    const unit_price = parseFloat($button.data("price"));
    const qty = parseInt($button.data("qty"), 10);
    const subtotal = parseFloat($("#subtotal").text().slice(1));

    const total_deleted = unit_price * qty;

    //subtract deleted item's price
    $("#subtotal").text("฿" + (subtotal - total_deleted));
    $("#total").text("฿" + (subtotal - total_deleted + 100));

    try {
        const response = await fetch("/cart/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ item_id })
        });

        const card = $button.closest(".relative");
        card.remove();
    } catch(err) {
        console.error(err.message);
    }
        
});

//dismiss profile warning
$("#profile-alert-dismiss").click(function() {
    $("#profile-alert-overlay").addClass("hidden");
});

//address put request
$("#address-btn").click(async function() {
    const addressline1 = $("#addressline1").val().trim();
    const addressline2 = $("#addressline2").val().trim();
    const city = $("#city").val().trim();
    const province = $("#province").val().trim();
    const zipcode = $("#zipcode").val().trim();
    const country = $("#country").val().trim();

    const uid = $("#uid").val();

    //check all field required
    if (!addressline1 || !city || !province || !zipcode || !country) return window.location.href = "/profile";

    //zipcode length validation
    if(zipcode.length !== 5) {
        return window.location.href = "/profile";
    }
    
    try {
        await axios.put(`/profile/address/${uid}`, {
            address_line1: addressline1,
            address_line2: addressline2,
            city,
            province,
            country,
            zipcode
        });
        return window.location.href = "/profile";
    } catch (err) {
        console.error(err);
        return window.location.href = "/profile";
    }
});

$("#payment-btn").click(async function() {
    const credit_card_number = $("#cardNumber").val().trim();
    const credit_card_fullname = $("#fullName").val().trim();
    const exp_date = $("#expiryDate").val().trim();
    const cvc = $("#cvc").val().trim();

    const uid = $("#uid").val();

    //check all field required
    if (!credit_card_number || !credit_card_fullname || !exp_date || !cvc) return window.location.href = "/profile";

    //credit_card_num, exp_date, cvc length validation
    if (cvc.length !== 3 || credit_card_number.length !== 16 || exp_date.length > 5) {
        return window.location.href = "/profile";
    }

    try {
        await axios.put(`/profile/payment/${uid}`, {
            credit_card_number,
            credit_card_fullname,
            exp_date,
            cvc
        });
        return window.location.href = "/profile";
    } catch (err) {
        console.error(err);
        return window.location.href = "/profile";
    }
});

$("#edit-profile-btn").click(async function() {
    const username = $("#profile-username").val().trim();
    const fullNameParts = $("#profile-fullname").val().trim().split(/\s+/);
    const email = $("#profile-email").val().trim();
    const phoneNumber = $("#profile-phoneNumber").val().trim();

    const uid = $("#uid").val();

    if (fullNameParts.length < 2) {
        return window.location.href = "/profile";
    }

    const fName = fullNameParts.slice(0, -1).join(" ");
    const lName = fullNameParts.slice(-1).join("");

    //check all field required
    if (!username || !fName || !lName || !email || !phoneNumber) return window.location.href = "/profile";

    try {
        await axios.put(`/profile/user/${uid}`, {
            username, fName, lName, email, phoneNumber
        });
        return window.location.href = "/profile";
    } catch (err) {
        console.error(err);
        return window.location.href = "/profile";
    }
});