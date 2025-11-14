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

    async insertCartItems(prod, quantity, user_id) {
        const result = await pool.query(
            `INSERT INTO cart_items(unit_price, quantity, product_id, user_id)
            VALUES (?, ?, ?, ?)`, 
            [prod.price, quantity, prod.product_id, user_id]
        );
        return result.insertId;
    };

    async existCartItems(uid, pid) {
        const [result] = await pool.query(
            `SELECT * FROM cart_items
            WHERE user_id = ? AND product_id = ?`,
            [uid, pid]
        );
        return result[0];
    }

    async updateCartItems(cart_item_id, quantity) {
        const [result] = await pool.query(
            `UPDATE cart_items
            SET quantity = ?
            WHERE cart_items_id = ?`,
            [quantity, cart_item_id]
        );
        return result
    }

    async getAllCartItemsByUserId(uid) {
        const [result] = await pool.query(
            `SELECT * FROM cart_items ci
            INNER JOIN products p ON ci.product_id = p.product_id
            INNER JOIN product_images pi ON p.product_id = pi.product_id 
            WHERE user_id = ?`, [uid]
        );
        return result;
    }

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

    async getReviewsByProductId(pid) {
        const [result] = await pool.query(
            `SELECT `
        )
    } //incomplete

    async sendQtyUpdate(cart_item_id, qty) {
        const [result] = await pool.query(
            `UPDATE cart_items
            SET quantity = ?
            WHERE cart_items_id = ?`, [qty, cart_item_id]
        );
        return result;
    };

    async deleteCartItem(cart_item_id) {
        const result = await pool.query(
            `DELETE FROM cart_items
            WHERE cart_items_id = ?`, [cart_item_id]
        );
        return result;
    }

    async updateAddress(uid, addr1, addr2, city, province, country, zipcode) {
        const [result] = await pool.query(
            `UPDATE users
            SET address_line1 = ?,
                address_line2 = ?,
                city = ?,
                province = ?,
                country = ?,
                zipcode = ?
            WHERE user_id = ?`, [addr1, addr2, city, province, country, zipcode, uid]
        );
        return uid
    }

    async updatePayment(uid, creditCardNumber, creditCardFullname, expDate, cvc) {
        const [result] = await pool.query(
            `UPDATE users
             SET credit_card_number = ?,
                 credit_card_fullname = ?,
                 exp_date = ?,
                 cvc = ?
             WHERE user_id = ?`,
            [creditCardNumber, creditCardFullname, expDate, cvc, uid]
        );
        return uid;
    }

    async updateUser(uid, username, fName, lName, email, phoneNumber) {
        const [result] = await pool.query(
            `UPDATE users
             SET username = ?,
                 f_name = ?,
                 l_name = ?,
                 email = ?,
                 phone_number = ?
             WHERE user_id = ?`,
            [username, fName, lName, email, phoneNumber, uid]
        )
        return uid;
    }

    async searchProducts(title) {
        const [result] = await pool.query(
            `SELECT * FROM products p
            INNER JOIN product_images pi ON p.product_id = pi.product_id
            WHERE title LIKE ?`, [`%${title}%`]);
        return result;
    }

    async getAllCategories() {
        const [results] = await pool.query(
            `SELECT DISTINCT category FROM products`
        );
        return results;
    }

    async getProductsByCategory(category) {
        const [results] = await pool.query(
            `SELECT * FROM products p
             INNER JOIN product_images pi ON p.product_id = pi.product_id
             WHERE p.category = ?`,
            [category]
        );
        return results;
    }
};

export default new DB();
