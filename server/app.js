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

dbConnect();


// 여기서부터는 서버 API 코드
const app = express();

const port = 3000;

const my_api_key = process.env.API_KEY;

const headers = {
  "X-Riot-Token": my_api_key
};

const tierEnums = {
  SUPER_FAST: 1,
  RANK: 0,
};

async function getAllInfo(nickname) {
  let all_info = {};

  all_info['userInfo'] = await getUserInfoByNickname(nickname);

  let matchIdList = await getMatchIdList(all_info['userInfo']['puuid'], 1);

  temp = await getMatchInfo(matchIdList);
  all_info['match_info'] = temp['match_info'];
  all_info['legends_info'] = temp['legends_info'];
  all_info['synergy_info'] = temp['synergy_info'];
  all_info['units_info'] = temp['units_info'];
  all_info['items_info'] = temp['items_info'];
  all_info['augments_info'] = temp['augments_info'];
  all_info['synergy_in_matches_info'] = temp['synergy_in_matches_info'];
  // all_info['units_in_matches_info'] = temp['units_in_matches_info'];
  all_info['units_use_items_info'] = temp['units_use_items_info'];
  all_info['augments_in_matches_info'] = temp['augments_in_matches_info'];
}

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
  user['nickname'] = response['data']['name'];
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
  user_tier[tierEnums.SUPER_FAST]['game_type'] = response_league['data'][tierEnums.SUPER_FAST]['queueType'];
  user_tier[tierEnums.SUPER_FAST]['tier'] = response_league['data'][tierEnums.SUPER_FAST]['ratedTier'];
  user_tier[tierEnums.SUPER_FAST]['sub_tier'] = 'I';
  user_tier[tierEnums.SUPER_FAST]['league_point'] = response_league['data'][tierEnums.SUPER_FAST]['ratedRating'];
  user_tier[tierEnums.SUPER_FAST]['date_in_tier'] = Date.now();

  // 랭크 게임
  user_tier[tierEnums.RANK]['puuid'] = response_summoner['data']['puuid'];
  user_tier[tierEnums.RANK]['game_type'] = response_league['data'][tierEnums.RANK]['queueType'];
  user_tier[tierEnums.RANK]['tier'] = response_league['data'][tierEnums.RANK]['tier'];
  user_tier[tierEnums.RANK]['sub_tier'] = response_league['data'][tierEnums.RANK]['rank'];
  user_tier[tierEnums.RANK]['league_point'] = response_league['data'][tierEnums.RANK]['leaguePoints'];
  user_tier[tierEnums.RANK]['date_in_tier'] = Date.now();

  // user table
  user['win'] = response_league['data'][tierEnums.RANK]['wins'];
  user['defeat'] = response_league['data'][tierEnums.RANK]['losses'];

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

  // 먼저 참가자들 데이터부터 유저 테이블에 저장 
  let participants = response_match['data']['info']['participants'];
  // participants.forEach(async element => await getUserInfoByPuuid(element['puuid']));

  // 전적 테이블
  let all_info = {};

  // 전적 테이블 
  all_info['match_info'] = {};
  all_info['match_info']['match_id'] = [];
  all_info['match_info']['game_type'] = [];
  all_info['match_info']['playdate'] = [];
  all_info['match_info']['puuid'] = [];
  all_info['match_info']['left_gold'] = [];
  all_info['match_info']['levels'] = [];
  all_info['match_info']['rank'] = [];
  all_info['match_info']['last_round'] = [];
  all_info['match_info']['playtime'] = [];

  all_info['legends_info'] = [];
  all_info['synergy_info'] = [];
  all_info['units_info'] = [];
  all_info['items_info'] = [];
  all_info['augments_info'] = [];
  all_info['synergy_in_matches_info'] = [];
  // all_info['units_in_matches_info'] = [];
  all_info['units_use_items_info'] = [];
  all_info['augments_in_matches_info'] = [];

  participants.forEach((e) => {
    // 전적 테이블 
    all_info['match_info']['match_id'].push(match_id);
    all_info['match_info']['game_type'].push(response_match['data']['info']['tft_game_type']);
    all_info['match_info']['playdate'].push(Unix_timestamp(response_match['data']['info']['game_datetime']));
    all_info['match_info']['puuid'].push(e['puuid']);
    all_info['match_info']['left_gold'].push(e['gold_left']);
    all_info['match_info']['levels'].push(e['level']);
    all_info['match_info']['rank'].push(e['placement']);
    all_info['match_info']['last_round'].push(e['last_round']);
    all_info['match_info']['playtime'].push(e['time_eliminated']);

    all_info['legends_info'].push(getLegendsInfo(match_id, e));
    all_info['synergy_info'].push(getSynergyInfo(e));
    all_info['units_info'].push(getUnitsInfo(e));
    all_info['items_info'].push(getItemsInfo(e));
    all_info['augments_info'].push(getAugmentsInfo(e));
    all_info['synergy_in_matches_info'].push(getSynergyInMatchesInfo(match_id, e));
    // all_info['units_in_matches_info'] = temp['unitsInMatchesInfo'];
    all_info['units_use_items_info'].push(getUnitsUseItemsInfo(e));
    all_info['augments_in_matches_info'].push(getAugmentInMatchesInfo(match_id, e));
  });
  
  console.log(all_info);
  
  return all_info;
}

// 사용한 전설이 테이블 
function getLegendsInfo(match_id, participant) {
  let legends_info = {};

  legends_info['match_id'] = match_id;
  legends_info['puuid'] = participant['puuid'];
  legends_info['legends_name'] = participant['companion']['content_ID'];
  legends_info['legends_image_path'] = "";

  return legends_info;
}

function getSynergyInMatchesInfo(match_id, participant) {
  let synergy_in_matches_info = {};

  synergy_in_matches_info['match_id'] = match_id;
  synergy_in_matches_info['synergy_name'] = [];
  synergy_in_matches_info['puuid'] = participant['puuid'];

  participant['traits'].forEach((trait) => {
    synergy_in_matches_info['synergy_name'].push(trait['name']);
  });

  return synergy_in_matches_info;
}

function getSynergyInfo(participant) {
  let synergy_info = {};
  synergy_info['synergy_name'] = [];
  synergy_info['synergy_rank'] = [];
  synergy_info['synergy_image_path'] = [];

  participant['traits'].forEach((trait) => {
    synergy_info['synergy_name'].push(trait['name']);
    synergy_info['synergy_rank'].push(trait['tier_current']);
    synergy_info['synergy_image_path'].push("");
  });

  return synergy_info;
}

function getAugmentInMatchesInfo(match_id, participant) {
  let augments_in_matches_info = {};

  augments_in_matches_info['match_id'] = match_id;
  augments_in_matches_info['puuid'] = participant['puuid'];

  switch (participant['augments'].length) {
    case 0:
      augments_in_matches_info['augments_name1'] = null;
      augments_in_matches_info['augments_name2'] = null;
      augments_in_matches_info['augments_name3'] = null;
      break;
    case 1:
      augments_in_matches_info['augments_name1'] = participant['augments'][0];
      augments_in_matches_info['augments_name2'] = null;
      augments_in_matches_info['augments_name3'] = null;
      break;
    case 2:
      augments_in_matches_info['augments_name1'] = participant['augments'][0];
      augments_in_matches_info['augments_name2'] = participant['augments'][1];
      augments_in_matches_info['augments_name3'] = null;
      break;
    case 3:
      augments_in_matches_info['augments_name1'] = participant['augments'][0];
      augments_in_matches_info['augments_name2'] = participant['augments'][1];
      augments_in_matches_info['augments_name3'] = participant['augments'][2];
      break; s
    default:
      augments_in_matches_info['augments_name1'] = null;
      augments_in_matches_info['augments_name2'] = null;
      augments_in_matches_info['augments_name3'] = null;
      break;
  }

  return augments_in_matches_info;
}

function getAugmentsInfo(participant) {
  let augments_info = {};
  // 증강체 테이블
  if (participant['augments'].length == 0) {
    augments_info['augments_name'] = null;
    augments_info['augments_image_path'] = "";
  }
  else {
    augments_info['augments_name'] = [];
    augments_info['augments_image_path'] = [];
    participant['augments'].forEach((aguments) => {
      augments_info['augments_name'].push(aguments);
      augments_info['augments_image_path'].push("");
    });
  }

  return augments_info;
}

function getUnitsUseItemsInfo(participant) {
  let units_use_items_info = {};

  units_use_items_info['units_name'] = [];
  units_use_items_info['units_rank'] = [];
  units_use_items_info['item_name1'] = [];
  units_use_items_info['item_name2'] = [];
  units_use_items_info['item_name3'] = [];

  participant['units'].forEach((unit) => {
    units_use_items_info['units_name'].push(unit['character_id']);
    units_use_items_info['units_rank'].push(unit['tier']);

    switch (unit['itemNames'].length) {
      case 0:
        units_use_items_info['item_name1'].push(null);
        units_use_items_info['item_name2'].push(null);
        units_use_items_info['item_name3'].push(null);
        break;
      case 1:
        units_use_items_info['item_name1'].push(unit['itemNames'][0]);
        units_use_items_info['item_name2'].push(null);
        units_use_items_info['item_name3'].push(null);
        break;
      case 2:
        units_use_items_info['item_name1'].push(unit['itemNames'][0]);
        units_use_items_info['item_name2'].push(unit['itemNames'][1]);
        units_use_items_info['item_name3'].push(null);
        break;
      case 3:
        units_use_items_info['item_name1'].push(unit['itemNames'][0]);
        units_use_items_info['item_name2'].push(unit['itemNames'][1]);
        units_use_items_info['item_name3'].push(unit['itemNames'][2]);
        break;
      default:
        units_use_items_info['item_name1'].push(null);
        units_use_items_info['item_name2'].push(null);
        units_use_items_info['item_name3'].push(null);
        break;
    }
  });

  return units_use_items_info;
}

function getUnitsInfo(participant) {
  let units_info = {};

  units_info['units_name'] = [];
  units_info['units_rank'] = [];
  units_info['units_cost'] = [];
  units_info['units_image_path'] = [];

  participant['units'].forEach((unit) => {
    units_info['units_name'].push(unit['character_id']);
    units_info['units_rank'].push(unit['tier']);
    units_info['units_cost'].push(unit['rarity'] + 1);
    units_info['units_image_path'].push("");
  });

  return units_info;
}

function getItemsInfo(participant) {
  let items_info = {};

  items_info['item_name'] = new Set();
  items_info['item_image_path'] = [];

  participant['units'].forEach((unit) => {
    unit['itemNames'].forEach((itemName) => {
      items_info['item_name'].add(itemName);
    });
  });

  for (i = 0; i < items_info['item_name'].size; i++) {
    items_info['item_image_path'].push("");
  }

  return items_info;
}

function Unix_timestamp(t) {
  var date = new Date(t * 1000);
  var year = date.getFullYear();
  var month = "0" + (date.getMonth() + 1);
  var day = "0" + date.getDate();
  var hour = "0" + date.getHours();
  var minute = "0" + date.getMinutes();
  var second = "0" + date.getSeconds();
  return year + "-" + month.substr(-2) + "-" + day.substr(-2) + " " + hour.substr(-2) + ":" + minute.substr(-2) + ":" + second.substr(-2);
}

//client가 "/"경로에 get 요청을 보내면
//req는 요청객체, res는 응답객체 이다.
app.get("/summoners/by-name/:nickname", async (req, res) => {
  let { nickname } = req.params;


  let user_info = await getUserInfoByNickname(nickname);
  // 이거는 API 요청하기 전에, 최신 전적 MATCH_ID 불러와서 그거랑 맞는 MATCH_ID 나올 때까지 함수 돌리는 걸로 하자.
  let match_list = await getMatchIdList(user_info['user']['puuid'], 1);

  await getMatchInfo(match_list[0]);
});

//middleware
//port에 접속 성공하면 콜백 함수를 실행시킨다.
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});