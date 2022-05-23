require('dotenv').config();

const axios = require('axios');

const my_api_key = process.env.API_KEY;

console.log(my_api_key);

const headers = {
  "X-Riot-Token": my_api_key
  
    // "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36",
    // "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    // "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
    // "Origin": "https://developer.riotgames.com",
    // "X-Riot-Token": "RGAPI-9b4295fc-5774-4015-b8b9-bb82736dec86"

};

const tierEnums = {
  SUPER_FAST: 1,
  RANK: 0,
};

async function getAllInfo(nickname) {
  let all_info = [];

  for (i = 0; i < 8; i++) {
    all_info.push({});
  }

  try {
    all_info[0]['user_info'] = await getUserInfoByNickname(nickname);
  } catch (error) {
    console.log('getUserInfoByNickname');
    console.log(error);
  }

  let searchUserInfo = all_info[0]['user_info'];
  let searchUserPuuid = all_info[0]['user_info']['user']['puuid'];

  let matchIdList;
  try {
    // 숫자 바꿔서 매치 목록 원하는 만큼 가져올 수 있음
    matchIdList = await getMatchIdList(searchUserPuuid, 1);
  } catch (error) {
    console.log(error);
  }

  temp = await getMatchInfo(matchIdList);

  for (i = 0; i < 8; i++) {
    // 조건문 다시 짜기
    if (searchUserPuuid != temp['match_info'][i]['puuid'][i]) {
      let participantPuuid = temp['match_info'][i]['puuid'][i];
      all_info[i]['user_info'] = await getUserInfoByPuuid(participantPuuid);
    } else {
      all_info[i]['user_info'] = searchUserInfo;
    }

    all_info[i]['match_info'] = temp['match_info'][i];
    all_info[i]['legends_info'] = temp['legends_info'][i];
    all_info[i]['synergy_info'] = temp['synergy_info'][i];
    all_info[i]['units_info'] = temp['units_info'][i];
    all_info[i]['items_info'] = temp['items_info'][i];
    all_info[i]['augments_info'] = temp['augments_info'][i];
    all_info[i]['synergy_in_matches_info'] = temp['synergy_in_matches_info'][i];
    all_info[i]['units_in_matches_info'] = temp['units_in_matches_info'][i];
    all_info[i]['augments_in_matches_info'] = temp['augments_in_matches_info'][i];
  }

  return all_info;
}

async function getUserInfoByNickname(nickname) {
  try {
    response_summoner = await axios.get('https://kr.api.riotgames.com/tft/summoner/v1/summoners/by-name/' + encodeURI(nickname), { headers: headers} );
    return await parsingUserInfo(response_summoner);
  } catch (error) {
    console.log('getUserInfoByNickname');
    console.log(error);
  }
  // user table
}

async function getUserInfoByPuuid(puuid) {
  try {
    response_summoner = await axios.get('https://kr.api.riotgames.com/tft/summoner/v1/summoners/by-puuid/' + puuid + "?api_key=" + my_api_key);
    return await parsingUserInfo(response_summoner);
  } catch (error) {
    console.log('getUserInfoByPuuid');
    console.log(error);
  }
}

async function parsingUserInfo(response) {
  let user = {};

  user['puuid'] = response['data']['puuid'];
  user['summoner_id'] = response['data']['id'];
  user['nickname'] = response['data']['name'].toString().replace(/(\s*)/g, "");
  user['levels'] = response['data']['summonerLevel'];
  user['updateAt'] = new Date().toISOString().slice(0, 19).replace('T', ' ');;
  user['icon_id'] = response['data']['profileIconId'];

  // user_profile table
  let profile = {};

  profile['icon_id'] = response['data']['profileIconId'];
  profile['icon_image'] = "";

  try {
    response_league = await axios.get('https://kr.api.riotgames.com/tft/league/v1/entries/by-summoner/' + user['summoner_id'] + "?api_key=" + my_api_key);
  } catch (error) {
    console.log(error);
  }

  // user_tier table
  let user_superfast = new Map();
  let user_ranks = new Map();
  let superfast = new Map();
  let ranks = new Map();

  if (response_league['data'].length == 0) {
    // 초고속 모드
    user_superfast['puuid'] = response_summoner['data']['puuid'];
    user_superfast['date_in_sf'] = new Date().toISOString().slice(0, 19).replace('T', ' ');;
    user_superfast['tier'] = 'Unranked';
    user_superfast['league_point'] = 0;

    superfast['tier'] = 'Unranked';
    superfast['image_path'] = "";

    // 랭크 게임
    user_ranks['puuid'] = response_summoner['data']['puuid'];
    user_ranks['date_in_ranks'] = new Date().toISOString().slice(0, 19).replace('T', ' ');;
    user_ranks['tier'] = 'Unranked';
    user_ranks['sub_tier'] = 'N';
    user_ranks['league_point'] = 0;
    user_ranks['win'] = 0;
    user_ranks['defeat'] = 0;
    user_ranks['top4'] = 0;

    ranks['tier'] = 'Unranked';
    ranks['sub_tier'] = 'N';
    ranks['image_path'] = "";
  } else if (response_league['data'].length == 1 && response_league['data'][0]['queueType'] == 'RANKED_TFT_TURBO') {
    // 초고속 모드
    user_superfast['puuid'] = response_summoner['data']['puuid'];
    user_superfast['date_in_sf'] = new Date().toISOString().slice(0, 19).replace('T', ' ');;
    user_superfast['tier'] = response_league['data'][0]['ratedTier'];
    user_superfast['league_point'] = response_league['data'][0]['ratedRating'];

    superfast['tier'] = response_league['data'][0]['ratedTier'];
    superfast['image_path'] = "";

    // 랭크 게임
    user_ranks['puuid'] = response_summoner['data']['puuid'];
    user_ranks['date_in_ranks'] = new Date().toISOString().slice(0, 19).replace('T', ' ');;
    user_ranks['tier'] = 'Unranked';
    user_ranks['sub_tier'] = 'N';
    user_ranks['league_point'] = 0;
    user_ranks['win'] = 0;
    user_ranks['defeat'] = 0;
    user_ranks['top4'] = 0;

    ranks['tier'] = 'Unranked';
    ranks['sub_tier'] = 'N';
    ranks['image_path'] = "";

  } else {
    if (response_league['data'].length == 1) {
      // 초고속 모드
      user_superfast['puuid'] = response_summoner['data']['puuid'];
      user_superfast['date_in_sf'] = new Date().toISOString().slice(0, 19).replace('T', ' ');;
      user_superfast['tier'] = 'Unranked';
      user_superfast['league_point'] = 0;

      superfast['tier'] = 'Unranked';
      superfast['image_path'] = "";

      // 랭크 게임
      user_ranks['puuid'] = response_summoner['data']['puuid'];
      user_ranks['date_in_ranks'] = new Date().toISOString().slice(0, 19).replace('T', ' ');;
      user_ranks['tier'] = response_league['data'][0]['tier'];
      user_ranks['sub_tier'] = response_league['data'][0]['rank'];
      user_ranks['league_point'] = response_league['data'][0]['leaguePoints'];
      user_ranks['win'] = response_league['data'][0]['wins'];
      user_ranks['defeat'] = response_league['data'][0]['losses'];
      user_ranks['top4'] = 0;

      ranks['tier'] = response_league['data'][0]['tier'];
      ranks['sub_tier'] = response_league['data'][0]['rank'];
      ranks['image_path'] = "";
    } else {
      let temp = response_league['data'];
      // console.log(response_league['data']);
      // console.log(typeof(response_league['data']));
      // console.log(response_league['data'][0]);
      // console.log(response_league['data'][1]);
      // console.log(typeof(response_league['data'][0]));
      // console.log(typeof(response_league['data'][1]));  

      // 초고속 모드
      user_superfast['puuid'] = response_summoner['data']['puuid'];
      user_superfast['date_in_sf'] = new Date().toISOString().slice(0, 19).replace('T', ' ');;
      user_superfast['tier'] = temp[1]['ratedTier'];
      user_superfast['league_point'] = response_league['data'][1]['ratedRating'];

      superfast['tier'] = temp[1]['ratedTier'];
      superfast['image_path'] = "";

      // 랭크 게임
      user_ranks['puuid'] = response_summoner['data']['puuid'];
      user_ranks['date_in_ranks'] = new Date().toISOString().slice(0, 19).replace('T', ' ');;
      user_ranks['tier'] = temp[0]['tier'];
      user_ranks['sub_tier'] = temp['rank'];
      user_ranks['league_point'] = temp['leaguePoints'];
      user_ranks['win'] = response_league['data'][0]['wins'];
      user_ranks['defeat'] = response_league['data'][0]['losses'];
      user_ranks['top4'] = 0;


      ranks['tier'] = response_league['data'][0]['tier'];
      ranks['sub_tier'] = response_league['data'][0]['rank'];
      ranks['image_path'] = "";
    }
  }

  let user_info = {};

  user_info['user'] = user;
  user_info['profile'] = profile;
  user_info['user_superfast'] = user_superfast;
  user_info['user_ranks'] = user_ranks;
  user_info['superfast'] = superfast;
  user_info['ranks'] = ranks;

  return user_info;
}

async function getMatchIdList(puuid, num) {
  try {
    response_match_id_list = await axios.get('https://asia.api.riotgames.com/tft/match/v1/matches/by-puuid/' + puuid + '/ids?count=' + num, { headers: headers });
    // 여기서 인덱스 바꾸면 다른 매치 데이터 저장 가능
    return response_match_id_list['data'][0];
  } catch (error) {
    console.log(error);
  }
}

async function getMatchInfo(match_id) {
  try {
    response_match = await axios.get('https://asia.api.riotgames.com/tft/match/v1/matches/' + match_id, { headers: headers });
  } catch (error) {
    console.log(error);
  }

  // 먼저 참가자들 데이터부터 유저 테이블에 저장 
  let participants = response_match['data']['info']['participants'];
  // participants.forEach(async element => await getUserInfoByPuuid(element['puuid']));

  // 전적 테이블`
  let all_info = {};

  // 전적 테이블 
  all_info['match_info'] = [];

  temp = {};
  temp['puuid'] = [];
  temp['match_id'] = [];
  temp['playtime'] = [];
  temp['game_type'] = [];
  temp['placement'] = [];
  temp['left_gold'] = [];
  temp['last_round'] = [];
  temp['levels'] = [];
  temp['playdate'] = [];
  temp['legends_name'] = [];

  all_info['legends_info'] = [];
  all_info['synergy_info'] = [];
  all_info['units_info'] = [];
  all_info['items_info'] = [];
  all_info['augments_info'] = [];
  all_info['synergy_in_matches_info'] = [];
  all_info['units_in_matches_info'] = [];
  all_info['augments_in_matches_info'] = [];

  participants.forEach((e) => {
    // 전적 테이블 
    temp['match_id'].push(match_id);
    temp['game_type'].push(response_match['data']['info']['tft_game_type']);
    temp['playdate'].push(new Date((response_match['data']['info']['game_datetime'])));
    temp['puuid'].push(e['puuid']);
    temp['left_gold'].push(e['gold_left']);
    temp['levels'].push(e['level']);
    temp['placement'].push(e['placement']);
    temp['last_round'].push(e['last_round']);
    temp['playtime'].push(e['time_eliminated']);
    temp['legends_name'].push(getLegendsInfo(e)['legends_name']);

    all_info['match_info'].push(temp);
    all_info['legends_info'].push(getLegendsInfo(e));
    all_info['synergy_info'].push(getSynergyInfo(e));
    all_info['units_info'].push(getUnitsInfo(e));
    all_info['items_info'].push(getItemsInfo(e));
    all_info['augments_info'].push(getAugmentsInfo(e));
    all_info['synergy_in_matches_info'].push(getSynergyInMatchInfo(match_id, e));
    all_info['units_in_matches_info'].push(getUnitsInMatchInfo(match_id, e));
    all_info['augments_in_matches_info'].push(getAugmentInMatchInfo(match_id, e));

  });

  return all_info;
}

// 사용한 전설이 테이블 
function getLegendsInfo(participant) {
  let legends_info = {};

  legends_info['legends_name'] = participant['companion']['content_ID'];
  legends_info['legends_image_path'] = "";

  return legends_info;
}

function getSynergyInMatchInfo(match_id, participant) {
  let synergy_in_matches_info = {};

  synergy_in_matches_info['puuid'] = [];
  synergy_in_matches_info['match_id'] = [];
  synergy_in_matches_info['synergy_name'] = [];

  participant['traits'].forEach((trait) => {
    synergy_in_matches_info['match_id'].push(match_id);
    synergy_in_matches_info['synergy_name'].push(trait['name']);
    synergy_in_matches_info['puuid'].push(participant['puuid']);
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

function getAugmentInMatchInfo(match_id, participant) {
  let augments_in_matches_info = {};

  augments_in_matches_info['puuid'] = participant['puuid'];
  augments_in_matches_info['match_id'] = match_id;

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
    participant['augments'].forEach((augments) => {
      augments_info['augments_name'].push(augments);
      augments_info['augments_image_path'].push("");
    });
  }

  return augments_info;
}

function getUnitsInMatchInfo(match_id, participant) {
  let units_in_matches_info = {};

  units_in_matches_info['puuid'] = [];
  units_in_matches_info['match_id'] = [];
  units_in_matches_info['used_unit_id'] = [];
  units_in_matches_info['units_name'] = [];
  units_in_matches_info['units_rank'] = [];
  units_in_matches_info['item_name1'] = [];
  units_in_matches_info['item_name2'] = [];
  units_in_matches_info['item_name3'] = [];

  participant['units'].forEach((unit) => {
    units_in_matches_info['match_id'].push(match_id);
    units_in_matches_info['puuid'].push(participant['puuid']);
    units_in_matches_info['units_name'].push(unit['character_id']);
    units_in_matches_info['units_rank'].push(unit['tier']);

    switch (unit['itemNames'].length) {
      case 0:
        units_in_matches_info['item_name1'].push(null);
        units_in_matches_info['item_name2'].push(null);
        units_in_matches_info['item_name3'].push(null);
        break;
      case 1:
        units_in_matches_info['item_name1'].push(unit['itemNames'][0]);
        units_in_matches_info['item_name2'].push(null);
        units_in_matches_info['item_name3'].push(null);
        break;
      case 2:
        units_in_matches_info['item_name1'].push(unit['itemNames'][0]);
        units_in_matches_info['item_name2'].push(unit['itemNames'][1]);
        units_in_matches_info['item_name3'].push(null);
        break;
      case 3:
        units_in_matches_info['item_name1'].push(unit['itemNames'][0]);
        units_in_matches_info['item_name2'].push(unit['itemNames'][1]);
        units_in_matches_info['item_name3'].push(unit['itemNames'][2]);
        break;
      default:
        units_in_matches_info['item_name1'].push(null);
        units_in_matches_info['item_name2'].push(null);
        units_in_matches_info['item_name3'].push(null);
        break;
    }
  });

  for (i = 0; i < participant['units'].length; i++) {
    for (j = 0; j < participant['units'].length; j++) {
      if (participant['units'][i]['rarity'] > participant['units'][j]['rarity']) {
        units_in_matches_info['units_name'][j] = units_in_matches_info['units_name'][i];
        units_in_matches_info['units_rank'][j] = units_in_matches_info['units_rank'][i];
        units_in_matches_info['item_name1'][j] = units_in_matches_info['item_name1'][i];
        units_in_matches_info['item_name2'][j] = units_in_matches_info['item_name2'][i];
        units_in_matches_info['item_name3'][j] = units_in_matches_info['item_name3'][i];
      }
    }
  }

  for (i = 0; i < participant['units'].length; i++) {
    units_in_matches_info['used_unit_id'].push(i);
  }

  return units_in_matches_info;
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

    if (unit['rarity'] == 5) { 
      units_info['units_cost'].push(unit['rarity']); 
    } else {
      units_info['units_cost'].push(unit['rarity'] + 1);
    }

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

exports.getAllInfo = getAllInfo;
// 원하는 함수 가져다 쓰고 싶으면
// exports.{원하는 함수명} = {사용할 함수명}
// 이렇게 가져가면 됌