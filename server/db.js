// mysql 패키지 
const mysql = require("mysql2");

// .env 파일을 읽어오기 위한 패키지
require('dotenv').config();

let connection;

// DB 코드
const dbConnect = async () => {
  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: "root",
      port: "3306",
      password: process.env.MYSQL_ROOT_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });

    console.log("mysql connection success");
  } catch (error) {
    console.log(error);
  }
};

const dbSelect = async (properties, tables, where) => {
  try {
    var sql = `SELECT ${properties} FROM ${tables} WHERE ${where};`;
    const [response] = await connection.promise().query(sql);
    return response;
  } catch (error) {
    console.log(error);
  }
}

const dbInsert = async (table, values) => {
  try {
    var sql = `INSERT INTO ${table} VALUES ?`;
    console.log(sql);
    console.log([values]);
    await connection.promise().query(sql, [values]);
  } catch (error) {
    console.log(error);
  }
};

const dbUpdate = async (table, set, where) => {
  try {
    var sql = `UPDATE ${table} SET ${set} WHERE ${where}`;
    console.log(sql);
    await connection.promise().query(sql);
  } catch (error) {
    console.log(error);
  }
}
exports.dbConnect = dbConnect;
exports.dbSelect = dbSelect;
exports.dbInsert = dbInsert;
exports.dbUpdate = dbUpdate;
// 원하는 함수 가져다 쓰고 싶으면
// exports.{원하는 함수명} = {사용할 함수명}
// 이렇게 가져가면 됌