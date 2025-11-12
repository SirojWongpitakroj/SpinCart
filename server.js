import express from "express";
import bodyParser from "body-parser";
import db from "./database.js";
import bcrypt from "bcrypt";
import session from "express-session";

const app = express();

//middleware

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SECRET, 
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 }, // 1 hour
    rolling: true
}))

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        redirect("/");
    }
}

//helper function
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


//main
app.get("/", async (req, res) => {
    let ishidden = "";
    if (req.session.user) {
       ishidden = "hidden"; 
    } else {
        ishidden = ""
    } 

    res.render("home.ejs", { 
        hideLogin: ishidden, products: await db.getAllProductAndImage() 
    });
});

app.post("/product", async (req, res) => {
    const prodId = req.body.id;
    const product = await db.getProductById(prodId);
    product.price = formatPrice(parseFloat(product.price));

    res.render("product.ejs", { prod: product });
});

app.get("/cart", (req, res) => res.render("cart.ejs"));

app.post("/cart/add", async (req, res) => {
    const prodId = req.body.id
    const product = await db.getProductById(prodId);

    
    //incomplete
});



app.get("/profile", (req, res) => res.render("profile.ejs"));
app.get("/payment", (req, res) => res.render("payment.ejs"));

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
    console.log(await db.registerUser(username, hashedPassword, fName, lName, gender, bDate, email, phoneNumber));
    redirect("/");
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

    req.session.user = { id: user.user_id, username: username };
    res.redirect("/");
});

app.listen(process.env.PORT, () => {
    console.log(`Server is up and running at port:${process.env.PORT}`);
})


