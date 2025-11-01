import express from "express";

const app = express();
const port = 3000;

//middleware

app.use(express.static("public"));


//main
app.get("/", (req, res) => res.render("home.ejs"));
app.get("/cart", (req, res) => res.render("cart.ejs"));
app.get("/profile", (req, res) => res.render("profile.ejs"));
app.get("/payment", (req, res) => res.render("payment.ejs"));
app.get("/product", (req, res) => res.render("product.ejs"));
app.get("/signup", (req, res) => res.render("signup.ejs"));

app.listen(port, () => {
    console.log(`Server is up and running at port:${port}`);
})


