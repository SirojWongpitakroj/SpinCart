import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB
});


class DB {
    async getAllProductAndImage() {
        const [rows] = await pool.query(`
        SELECT * FROM products p
        INNER JOIN product_images pi ON p.product_id = pi.product_id`);
        return rows;
    };

    async getProductById(id) {
        const [row] = await pool.query(
            `SELECT * FROM products p
            INNER JOIN product_images pi ON p.product_id = pi.product_id
            WHERE p.product_id = ?`,
            [id]
        );
        return row[0];
    };

    async insertCartItems(prod) {
        const result = await pool.query(
            `INSERT INTO cart_items_id(unit_price, quantity, product_id, user_id)
            VALUES ()`
        )
    };

    async registerUser(username, password_hash, fName, lName, gender, bDate, email, phoneNumber) {
        const result = await pool.query(
            `INSERT INTO users(username, password_hash, f_name, l_name, gender, birth_date, email, phone_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [username, password_hash, fName, lName, gender, bDate, email, phoneNumber]
        );
        return this.getUserByUsername(username);
    };

    async getUserByUsername(username) {
        const [result] = await pool.query(
            `SELECT * FROM users
            WHERE username = ?`, [username]
        );
        return result[0];
    };

    async getDuplicateEmail(email) {
        const [result] = await pool.query(
            `SELECT email FROM users
            WHERE email = ?`, [email]
        );
        return result[0];
    }
};

// const database1 = new DB();
// console.log(await database1.getUserByUsername(""));

export default new DB();



