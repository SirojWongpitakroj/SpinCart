import express from "express";
import bodyParser from "body-parser";
import db from "./database.js";

const app = express();

//middleware

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

//helper function
function formatPrice(price) {
    if (price % 1 === 0) {
        return Math.round(price);
    } else {
        return price;
    }
};


//main
app.get("/", async (req, res) => {
    res.render("home.ejs", { products: await db.getAllProductAndImage() });
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
    
});

app.get("/profile", (req, res) => res.render("profile.ejs"));
app.get("/payment", (req, res) => res.render("payment.ejs"));
app.get("/signup", (req, res) => res.render("signup.ejs"));

app.listen(process.env.PORT, () => {
    console.log(`Server is up and running at port:${process.env.PORT}`);
})


