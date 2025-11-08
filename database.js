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
};

// const database1 = new DB();
// console.log(await database1.getAllProductAndImage());

export default new DB();



