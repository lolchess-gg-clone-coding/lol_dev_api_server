const lol_api = require('./lol_api');
const db = require('./db.js');
const express = require("express");

// axios는 http 요청 관리하는 패키지
const axios = require('axios');

const app = express();

const port = 3000;

db.dbConnect();
//client가 "/"경로에 get 요청을 보내면
//req는 요청객체, res는 응답객체 이다.
app.get("/summoners/by-name/:nickname", async (req, res) => {
    let { nickname } = req.params;

    console.log(await lol_api.getAllInfo(nickname));
});

//middleware
//port에 접속 성공하면 콜백 함수를 실행시킨다.
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});