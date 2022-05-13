const mysql = require("mysql2/promise");
const axios = require('axios');
const express = require("express");

require('dotenv').config();

console.log(process.env.MYSQL_ROOT_PASSWORD);

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

dbConnect();


const app = express();

const port = 3000;

const my_api_key = process.env.API_KEY;

const headers = {
  "X-Riot-Token": my_api_key
};

//middleware이다.
//client가 "/"경로에 get 요청을 보내면
//req는 요청객체, res는 응답객체 이다.
app.get("/summoners/by-name/:nickname", async (req, res) => {
  let { nickname } = req.params;
  // console.log('https://kr.api.riotgames.com/tft/summoner/v1/summoners/by-name/' + encodeURI(nickname) + "?api_key=" + my_api_key);
  response_summoner = await axios.get('https://kr.api.riotgames.com/tft/summoner/v1/summoners/by-name/' + encodeURI(nickname) + "?api_key=" + my_api_key);
  // user table
  let puuid = response_summoner['data']['puuid'];
  let summonerId = response_summoner['data']['id'];
  console.log("puuid: " + puuid);
  console.log("summonerId: " + summonerId);
  // nickname = response_summoner['data']['name'];
  // levels = response_summoner['data']['summonerLevel'];

  // user_profile table
  // puuid = response_summoner['data']['puuid'];
  // icon_id = response_summoner['data']['profileIconId'];
  // icon_image = 없음

  response_league = await axios.get('https://kr.api.riotgames.com/tft/league/v1/entries/by-summoner/' + summonerId + "?api_key=" + my_api_key);
  console.log("response_league:");
  console.log(response_league['data']);
  // user_tier table
  // puuid = response_summoner['data']['puuid'];

  // 초고속 모드
  // game_type = response_league['data'][0]['queueType'];
  // tier = reponse_laegue['data'][0]['ratedTier'] ;
  // league_point = response_league['data'][0]['ratedRating'];

  // user table
  // win = response_league['data'][0]['win'];
  // defeat = response_league['data'][0]['losses'];

  // 랭크 게임
  // game_type = response_league['data'][1]['queueType'];
  // tier = response_league['data'][1]['tier'];
  // sub_tier = response_league['data'][1]['rank'];
  // league_point = response_league['data'][1]['leaguePoints'];

  // user table
  // win = response_league['data'][1]['win'];
  // defeat = response_league['data'][1]['losses'];


  response_match_id_list = await axios.get('https://asia.api.riotgames.com/tft/match/v1/matches/by-puuid/' + puuid + '/ids?count=20', { headers: headers });
  console.log(response_match_id_list['data']);
  let match_id = response_match_id_list['data'];

  response_match = await axios.get('https://asia.api.riotgames.com/tft/match/v1/matches/' + match_id[0], { headers: headers });

  console.log("summoner: ");
  console.log(response_summoner['data']);
  console.log("\nleague:");
  console.log(response_league['data']);
  console.log("\nmatch_id_list:");
  console.log(response_match_id_list['data']);
  console.log("\nresponse_match:");
  console.log(response_match['data']);
  console.log("\nresponse_match_participants:");
  console.log(response_match['data']['info']['participants']);
  console.log("\nresponse_match_participants[0]_traits:");
  console.log(response_match['data']['info']['participants'][0]['traits']);
  console.log("\nresponse_match_participants[0]_units:");
  console.log(response_match['data']['info']['participants'][0]['units']);
});

//middleware
//port에 접속 성공하면 콜백 함수를 실행시킨다.
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});