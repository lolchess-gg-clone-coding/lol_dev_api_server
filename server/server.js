const db_api = require('./db_api.js');
const express = require("express");

const app = express();

const port = 3000;

//client가 "/"경로에 get 요청을 보내면
//req는 요청객체, res는 응답객체 이다.
app.get("/summoners/by-name/:nickname", async (req, res) => {
    let { nickname } = req.params;

    await db_api.initApi(nickname);
    await db_api.insertTFTParticipantsData();
    await db_api.insertTFTParticipantsMatchesData();
});

//middleware
//port에 접속 성공하면 콜백 함수를 실행시킨다.
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});