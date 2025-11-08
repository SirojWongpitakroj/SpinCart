import express from "express";
import bodyParser from "body-parser";
import db from "./database.js";

const app = express();
const port = 3000;

//middleware

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

//main
app.get("/", async (req, res) => {
    res.render("home.ejs", { products: await db.getAllProductAndImage() });
});

app.get("/cart", (req, res) => res.render("cart.ejs"));
app.get("/profile", (req, res) => res.render("profile.ejs"));
app.get("/payment", (req, res) => res.render("payment.ejs"));
app.get("/product", (req, res) => res.render("product.ejs"));
app.get("/signup", (req, res) => res.render("signup.ejs"));

app.listen(port, () => {
    console.log(`Server is up and running at port:${port}`);
})


