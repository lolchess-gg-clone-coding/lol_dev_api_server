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

const tierEnums = {
  SUPER_FAST : 0,
  RANK : 1,
};

async function getUserInfoByNickname(nickname) {
  response_summoner = await axios.get('https://kr.api.riotgames.com/tft/summoner/v1/summoners/by-name/' + encodeURI(nickname) + "?api_key=" + my_api_key);
  return await parsingUserInfo(response_summoner);
  // user table
}

async function getUserInfoByPuuid(puuid) {
  response_summoner = await axios.get('https://kr.api.riotgames.com/tft/summoner/v1/summoners/by-puuid/' + value + "?api_key=" + my_api_key);
  return await parsingUserInfo(response_summoner);
}

async function parsingUserInfo(response) {
  let user = {};
  user['puuid'] = response['data']['puuid'];
  user['summonerId'] = response['data']['id'];
  console.log("puuid: " + user['puuid']);
  console.log("summonerId: " + user['summonerId']);
  user['nickname']= response['data']['name'];
  user['levels'] = response['data']['summonerLevel'];

  // user_profile table
  let user_profile = {};
  user_profile['puuid'] = response['data']['puuid'];
  user_profile['icon_id'] = response['data']['profileIconId'];
  user_profile['icon_image'] = "";

  response_league = await axios.get('https://kr.api.riotgames.com/tft/league/v1/entries/by-summoner/' + user['summonerId'] + "?api_key=" + my_api_key);
  // user_tier table
  let user_tier = [{}, {}];

  // 초고속 모드
  user_tier[tierEnums.SUPER_FAST]['puuid'] = response_summoner['data']['puuid'];
  user_tier[tierEnums.SUPER_FAST]['game_type'] = response_league['data'][0]['queueType'];
  user_tier[tierEnums.SUPER_FAST]['tier'] = response_league['data'][0]['ratedTier'];
  user_tier[tierEnums.SUPER_FAST]['sub_tier'] = 'I';
  user_tier[tierEnums.SUPER_FAST]['league_point'] = response_league['data'][0]['ratedRating'];
  user_tier[tierEnums.SUPER_FAST]['date_in_tier'] = Date.now();

  // 랭크 게임
  user_tier[tierEnums.RANK]['puuid'] = response_summoner['data']['puuid'];
  user_tier[tierEnums.RANK]['game_type'] = response_league['data'][1]['queueType'];
  user_tier[tierEnums.RANK]['tier'] = response_league['data'][1]['tier'];
  user_tier[tierEnums.RANK]['sub_tier'] = response_league['data'][1]['rank'];
  user_tier[tierEnums.RANK]['league_point'] = response_league['data'][1]['leaguePoints'];
  user_tier[tierEnums.SUPER_FAST]['date_in_tier'] = Date.now();
  console.log("user_tier:");
  console.log(user_tier);

  // user table
  user['win'] = response_league['data'][tierEnums.RANK]['wins'];
  user['defeat'] = response_league['data'][tierEnums.RANK]['losses'];

  console.log("user:")
  console.log(user);

  let user_info = {};

  user_info['user'] = user;
  user_info['profile'] = user_profile;
  user_info['tier'] = user_tier;

  return user_info;
}

async function getMatchIdList(puuid, num) {
  response_match_id_list = await axios.get('https://asia.api.riotgames.com/tft/match/v1/matches/by-puuid/' + puuid + '/ids?count=' + num, { headers: headers });
  return response_match_id_list['data'];
}

async function getMatchInfo(match_id) {
  response_match = await axios.get('https://asia.api.riotgames.com/tft/match/v1/matches/' + match_id, { headers: headers });

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
}
//middleware이다.
//client가 "/"경로에 get 요청을 보내면
//req는 요청객체, res는 응답객체 이다.
app.get("/summoners/by-name/:nickname", async (req, res) => {
  let { nickname } = req.params;
  

  let user_info = await getUserInfoByNickname(nickname);
  // 이거는 API 요청하기 전에, 최신 전적 MATCH_ID 불러와서 그거랑 맞는 MATCH_ID 나올 때까지 함수 돌리는 걸로 하자.
  let match_list = await getMatchIdList(user_info['user']['puuid'], 20);

  await getMatchInfo(match_list[0]);
});

//middleware
//port에 접속 성공하면 콜백 함수를 실행시킨다.
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});