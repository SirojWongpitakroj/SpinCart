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

    async insertProduct(title, short_desc, long_desc, price, category, length, height, width, image_url) {
        const [result] = await pool.query(`CALL insert_product_and_image(?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [title, short_desc, long_desc, price, category, length, height, width, image_url]); 
        return result.insertId;
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

    async getBestComment(pid) {
        const [result] = await pool.query(
            `SELECT comment 
            FROM reviews
            WHERE product_id = ? AND rating = (
                SELECT MAX(rating) FROM reviews WHERE product_id = ?
            )
            ORDER BY rating DESC, comment IS NOT NULL DESC`,
            [pid, pid]
        );
        return result[0];
    } 


    async insertOrder(total, shipping_fee, subtotal, uid, payment_id) {
        const [result] = await pool.query(
            `INSERT INTO orders(total, shipping_fees, subtotal, status, user_id, payment_id)
            VALUES(?, ?, ?, "completed", ?, ?)`,
            [total, shipping_fee, subtotal, uid, payment_id]
        );
        return result.insertId;
    }

    async insertOrderItems(orderId, cartItems) {
        // Insert all order items from cart items
        var arrOfOrderItemsId = [];

        let result;
        let line_total;
        for (const item of cartItems) {
            line_total = item.price * item.quantity;
            [result] = await pool.query(
                `INSERT INTO order_items(quantity, unit_price, line_total, order_id, product_id)
                VALUES (?, ?, ?, ?, ?)`,
                [item.quantity, item.price, line_total, orderId, item.product_id]
            );
            arrOfOrderItemsId.push(result.insertId);
        }
        return arrOfOrderItemsId;
    }

    async deleteCartFromUser(uid) {
        const result = await pool.query(
            `DELETE FROM cart_items
            WHERE user_id = ?`, [uid]
        );
        return true;
    }

    async insertPayment(amount) {
        const [result] = await pool.query(
            `INSERT INTO payment(status, amount)
            VALUES("completed", ?)`, [amount]
        );

        return result.insertId;
    }

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

    async getOrderItemsProduct(order_items_ids) {
        if (!order_items_ids || order_items_ids.length === 0) {
            return [];
        }
        
        // Create placeholders for IN clause (?, ?, ?, ...)
        const placeholders = order_items_ids.map(() => '?').join(',');
        
        const [result] = await pool.query(
            `SELECT * FROM order_items oi
            INNER JOIN products p ON oi.product_id = p.product_id
            INNER JOIN product_images pi ON p.product_id = pi.product_id
            WHERE oi.order_items_id IN (${placeholders})`,
            order_items_ids
        );
        
        return result;
    }

    async insertReview(user_id, reviews) {
        if (!reviews || reviews.length === 0) {
            return [];
        }
        
        const insertedIds = [];
        
        for (const review of reviews) {
            const { productId, rating, comment } = review;
            
            // Only insert if rating > 0 (user actually rated the product)
            const [result] = await pool.query(
                `INSERT INTO reviews(rating, comment, product_id, user_id)
                VALUES (?, ?, ?, ?)`,
                [rating, comment || '', productId, user_id]
            );
            insertedIds.push(result.insertId);
        }
        
        return insertedIds;
    }

    async getCountReviewsByProdId(pid) {
        const [result] = await pool.query(
            `SELECT COUNT(*) as count FROM reviews
            WHERE product_id = ?`,
            [pid]
        );
        return result[0].count;
    }
};

// const db1 = new DB();
// console.log(await db1(2));

export default new DB();
