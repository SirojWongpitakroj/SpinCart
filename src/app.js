import express from "express";
import bodyParser from "body-parser";
import db from "./database.js";
import bcrypt from "bcrypt";
import session from "express-session";
import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/product_images");
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });


const app = express();
let category_chosen;

//middleware

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());

app.use(session({
    secret: process.env.SECRET, 
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 }, // 1 hour
    rolling: true
}))

app.use(async (req, res, next) => {
    try {
        const categories = await db.getAllCategories();
        res.locals.categories = categories;
    } catch (err) {
        console.error(err);
        res.locals.categories = [];
    }

    const chosen = req.session.categoryChosen || null;
    res.locals.categoryChosen = chosen;
    category_chosen = chosen;

    //Add isAdmin to res.locals
    if (req.session.user) {
        res.locals.isAdmin = req.session.user.isAdmin;
    } else {
        res.locals.isAdmin = false;
    }

    next();
});

//helper function
function checkAdmin(req, res, next) {
    if (req.session.user.isAdmin) {
        next();
    } else {
        return res.redirect("/");
    }
};

function formatPrice(price) {
    if (price % 1 === 0) {
        return Math.round(price);
    } else {
        return price;
    }
};

async function renderLoginError(res, username) {
    res.render("home.ejs", {
        hideLogin: "",
        products: await db.getAllProductAndImage(),
        hasLoginError: true 
    });
}

//Autheticate
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/");
    }
};

//Check for complete of filling up personal information (address and payment method)
async function completePersonalInfo(req, res, next) {
    const u = await db.getUserByUsername(req.session.user.username);
    if (u.address_line1 && u.city && u.province && u.zipcode && u.country && u.credit_card_number && u.cvc && u.exp_date) {
        return next();
    }
    req.session.incompleteForm = true;
    return res.redirect("/profile");
};

//main
app.get("/", async (req, res) => {
    let ishidden = "";
    if (req.session.user) {
       ishidden = "hidden"; 
    } else {
        ishidden = ""
    } 

    const selectedCategory = req.session.categoryChosen;
    let products;
    if (selectedCategory) {
        products = await db.getProductsByCategory(selectedCategory);
    } else {
        products = await db.getAllProductAndImage();
    }

    res.render("home.ejs", { 
        hideLogin: ishidden,
        products
    });
});

app.post("/filter/apply", (req, res) => {
    const { category } = req.body;
    const normalized = category && category !== "all" ? category : null;

    req.session.categoryChosen = normalized;
    category_chosen = normalized;

    res.json({ success: true, category: normalized });
});

app.post("/search", isAuthenticated, async (req, res) => {
    const searchWord = req.body.searchWord;
    const products = await db.searchProducts(searchWord);

    let ishidden = "";
    if (req.session.user) {
       ishidden = "hidden"; 
    } else {
        ishidden = ""
    } 

    res.render("home.ejs", { products: products, hideLogin: ishidden });
});

app.get("/product", isAuthenticated, async (req, res) => {
    const message = req.session.message;
    delete req.session.message;

    const prodId = parseInt(req.query.id);
    let product;
    try {
        product = await db.getProductById(prodId);
    } catch(err) {
        return res.redirect("/");
    }

    const commentJSON = await db.getBestComment(prodId);
    const countReview = await db.getCountReviewsByProdId(prodId);
    
    let comment;
    try {
        comment = commentJSON.comment; 
    } catch(err) {
        comment = "";
    }  
        
    
    product.price = formatPrice(parseFloat(product.price));

    res.render("product.ejs", { prod: product, cfmes: message, countReview: countReview, comment: comment });
});

app.get("/cart", isAuthenticated, async (req, res) => {
    const allCartItems = await db.getAllCartItemsByUserId(req.session.user.id);
    const subtotal = allCartItems.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
    const shippingFee = allCartItems.length > 0 ? 100 : 0;
    res.render("cart.ejs", { 
        items: allCartItems,
        subtotal: subtotal,
        shippingFee: shippingFee
    });
});

app.post("/cart/qtyUpdate", async (req, res) => {
    const { item_id, qty } = req.body;

    await db.sendQtyUpdate(item_id, qty);

    res.json({ seccess: true, message: "Quantity updated" });
});

app.post("/cart/add", isAuthenticated, async (req, res) => {
    const prodId = req.body.id;
    const quantity = parseInt(req.body.quantity);
    const product = await db.getProductById(prodId);
    
    const exist_cartItems = await db.existCartItems(req.session.user.id, prodId);
    if (exist_cartItems) {
        let total_quantity = quantity + exist_cartItems.quantity
        await db.updateCartItems(exist_cartItems.cart_items_id, total_quantity);
    } else {
        const cart_item_id = await db.insertCartItems(product, quantity, req.session.user.id);
    }
    
    
    req.session.message = quantity > 1 ? "The items have been added to cart" : "The item has been added to cart";
    res.redirect(`/product?id=${product.product_id}`);
});

app.post("/cart/delete", isAuthenticated, async (req, res) => {
    const cart_item_id = req.body.item_id
    try {
        const result = await db.deleteCartItem(cart_item_id);
    }  catch(err) {
        console.error(err.message);
    }

    return res.json({ success: true });
});



app.get("/profile", isAuthenticated, async (req, res) => {
    const incompleteForm = req.session.incompleteForm;
    delete req.session.incompleteForm;

    const user = await db.getUserByUsername(req.session.user.username);
    res.render("profile.ejs", { user, incompleteForm: incompleteForm });
});

app.put("/profile/address/:id", isAuthenticated, async (req, res) => {
    const uid = req.params.id;
    const { address_line1, address_line2, city, province, country, zipcode } = req.body;

    try {
        await db.updateAddress(uid, address_line1, address_line2, city, province, country, zipcode);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Unable to update address" });
    }
});

app.put("/profile/payment/:id", isAuthenticated, async (req, res) => {
    const uid = req.params.id;
    const { credit_card_number, credit_card_fullname, exp_date, cvc } = req.body;

    try {
        await db.updatePayment(uid, credit_card_number, credit_card_fullname, exp_date, cvc);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Unable to update payment" });
    }
});

app.put("/profile/user/:id", isAuthenticated, async (req, res) => {
    const uid = req.params.id;
    const { username, fName, lName, email, phoneNumber } = req.body;

    try {
        const existingUser = await db.getUserByUsername(username);
        if (existingUser && existingUser.user_id !== parseInt(uid, 10)) {
            return res.status(409).json({ success: false, message: "Username already taken" });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Unable to validate username" });
    }

    try {
        await db.updateUser(uid, username, fName, lName, email, phoneNumber);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Unable to update profile" });
    }
});

app.get("/payment", isAuthenticated, completePersonalInfo, async (req, res) => {
    
    const items = await db.getAllCartItemsByUserId(req.session.user.id);
    const user = await db.getUserByUsername(req.session.user.username);

    items.forEach(item => {
        item.price = formatPrice(item.price);
    });

    res.render("payment.ejs", { items, user });
});

app.get("/review", isAuthenticated, async (req, res) => {
    const arrOfOrderItemsId = req.session.orderItemsIds || [];

    const items = await db.getOrderItemsProduct(arrOfOrderItemsId);

    res.render("review.ejs", { items });
});

app.post("/review/submit", isAuthenticated, async (req, res) => {
    const user_id = req.session.user.id;
    const reviews = req.body.reviews || [];
    
    try {
        const insertedIds = await db.insertReview(user_id, reviews);
        res.json({ success: true, message: 'Reviews submitted successfully', insertedIds });
    } catch (error) {
        console.error('Error inserting reviews:', error);
        res.status(500).json({ success: false, message: 'Error submitting reviews' });
    }
});

app.post("/checkout", isAuthenticated, async (req, res) => {
    const subtotal = req.body.subtotal;
    const shipping_fee = 100;
    const total = subtotal + shipping_fee;
    const user_id = req.session.user.id;
    //insert payment
    const paymentId = await db.insertPayment(total);

    //insert order
    const orderId = await db.insertOrder(total, shipping_fee, subtotal, user_id, paymentId);
    
    const cart_items = await db.getAllCartItemsByUserId(req.session.user.id);
    //insert order_items
    const arrOfOrderItemsId =  await db.insertOrderItems(orderId, cart_items);

    //delete cart_items
    await db.deleteCartFromUser(user_id);

    //redirect to review
    req.session.orderItemsIds = arrOfOrderItemsId;
    res.redirect('/review');
})


app.get("/signup", (req, res) => {
    const error = req.session.error;
    delete req.session.error; // remove it so it doesn't persist
    res.render("signup.ejs", { error });
});

app.post("/signup/confirm", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const fName = req.body.firstName;
    const lName = req.body.lastName;
    const gender = req.body.gender;
    const bDate = req.body.bDate;
    const email = req.body.email;
    const phoneNumber = req.body.phoneNumber;
    
    //check username validity
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
        req.session.error = "The username has been taken";
        return res.redirect("/signup");
    }

    //check phoneNumber validity
    if (phoneNumber.length !== 10) {
        req.session.error = "The phone number is invalid";
        return res.redirect("/signup");
    }

    //check email validity
    const duplicateEmail = await db.getDuplicateEmail(email);
    if (duplicateEmail) {
        req.session.error = "The email has been taken";
        return res.redirect("/signup");
    }

    //if valid then bcrypt password
    const hashedPassword = await bcrypt.hash(password, 13);
    await db.registerUser(username, hashedPassword, fName, lName, gender, bDate, email, phoneNumber);
    res.redirect("/");
})

app.post("/login", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    //check Username
    const user = await db.getUserByUsername(username);
    if (!user) {
        return await renderLoginError(res, username);
    }

    //check bcrypt Password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
        return await renderLoginError(res, username);
    }

    req.session.user = { id: user.user_id, username: username, isAdmin: user.is_admin };
    res.redirect("/");
});

app.get("/admin", isAuthenticated, async (req, res) => {
    const message = req.session.message;
    delete req.session.message;
    res.render("admin.ejs", { message });
});

app.post("/admin/add-product", isAuthenticated, checkAdmin, upload.single("image"), async (req, res) => {

    const { title, short_desc, long_desc, price, category, length, width, height } = req.body;
    
    // Get the uploaded file name from multer
    const image_name = req.file ? "/product_images/" + req.file.filename : null;
    
    const insertId = await db.insertProduct(title, short_desc, long_desc, price, category, length, height, width, image_name);
    req.session.message = "Product added successfully";
    res.redirect("/admin");

});


export default app;


