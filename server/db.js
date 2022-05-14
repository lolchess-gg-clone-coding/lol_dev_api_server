// mysql 패키지 
const mysql = require("mysql2/promise");

// axios는 http 요청 관리하는 패키지
const axios = require('axios');
const express = require("express");

// .env 파일을 읽어오기 위한 패키지
require('dotenv').config();

console.log(process.env.MYSQL_ROOT_PASSWORD);

// DB 코드
const dbConnect = async () => {
  try {
    const connection = await mysql.createConnection({
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

exports.dbConnect = dbConnect;
// 원하는 함수 가져다 쓰고 싶으면
// exports.{원하는 함수명} = {사용할 함수명}
// 이렇게 가져가면 됌