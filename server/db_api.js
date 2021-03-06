const lol_api = require('./lol_api');
const db = require('./db.js');


let all_info;

const initApi = async (nickname) => {
    await db.dbConnect();
    all_info = await lol_api.getAllInfo(nickname);
}

// profile -> user, superfast & rank -> user_superfast & user_rank
const insertTFTUserData = async (account_id, participant) => {
    const [user] = await db.dbSelect('*', 'user', `user.account_id="${account_id}"`);

    if (user != undefined) {
            var isUpdatedTime = (new Date(Date.now()) - user['updateAt']) / (1000*60);
            var isRecent = isUpdatedTime < 5 ? true : false;
        if (isRecent) {
            for (const [key, value] of Object.entries(participant)) {
                if(key == account_id) continue;
                if(isString(value)) db.dbUpdate('USER', `${key} = "${value}"`, `account_id = "${account_id}"`);
                else db.dbUpdate('USER', `${key} = ${value}`, `account_id = "${account_id}"`);
            }
        } else {
            console.log(`User data already updated before ${isUpdatedTime}`);
        }
    } else {
        try {
            let insertData = [Array.from(new Map(Object.entries(participant)).values())];
            await db.dbInsert('USER', insertData);
            console.log('User data not exists');
        } catch (error) {
            console.log(error);
        }
    }
};

const insertTFTProfileData = async (icon_id, participant_profile) => {
    const [profile] = await db.dbSelect('*', 'profile', `profile.icon_id=${icon_id}`);
    // const [profile] = await db.dbSelect('icon_id', 'profile', `profile.icon_id=${all_info['user_info']['profile']['icon_id']}`);

    if (profile != undefined) {
        if (profile['icon_image'] != participant_profile['icon_image']) {
            for (const [key, value] of Object.entries(participant)) {
                if(key == icon_id) continue;
                db.dbUpdate('PROFILE', `${key} = "${value}"`, `icon_id = "${icon_id}"`);
            }
        } else {
            console.log('Profile exists');
        }
    } else {
        let insertData = [Array.from(new Map(Object.entries(participant_profile)).values())];
        try { await db.dbInsert('PROFILE', insertData); } catch (error) {
            console.log(error);
        }
    }
}

const insertTFTTierData = async (user_info) => {
    const [superfast] = await db.dbSelect('*', 'superfast', `superfast.tier="${user_info['superfast']['tier']}"`);
    const [ranks] = await db.dbSelect('*', 'ranks', `ranks.tier='${user_info['ranks']['tier']}' and ranks.sub_tier='${user_info['ranks']['sub_tier']}'`);
    const [user_superfast] = await db.dbSelect('*', 'user_superfast', `user_superfast.account_id='${user_info['user']['account_id']}'`);
    const [user_ranks] = await db.dbSelect('*', 'user_ranks', `user_ranks.account_id='${user_info['user']['account_id']}'`);
    // const [superfast] = await db.dbSelect('tier', 'superfast', `superfast.tier="${all_info['user_info']['superfast']['tier']}"`);
    // const [ranks] = await db.dbSelect('tier, sub_tier', 'ranks', `ranks.tier='${all_info['user_info']['ranks']['tier']}' and ranks.sub_tier='${all_info['user_info']['ranks']['sub_tier']}'`);
    // const [user_superfast] = await db.dbSelect('date_in_sf', 'user_superfast', `user_superfast.account_id='${all_info['user_info']['user']['account_id']}'`);
    // const [user_ranks] = await db.dbSelect('date_in_ranks', 'user_ranks', `user_ranks.account_id='${all_info['user_info']['user']['account_id']}'`);

    if (superfast != undefined) {
        if (superfast['image_path'] != user_info['superfast']['image_path']) {
            for (const [key, value] of Object.entries(user_info['superfast'])) {
                if(key == 'tier') continue;
                db.dbUpdate('SUPERFAST', `${key} = "${value}"`, `tier = "${user_info['superfast']['tier']}"`);
            }
        } else {
            console.log('Superfast tier exists');
        }
    } else {
        await insertTFTSuperfastData(user_info);
        console.log('Superfast data not exists');
    }

    if (ranks != undefined) {
        if (ranks['image_path'] != user_info['ranks']['image_path']) {
            for (const [key, value] of Object.entries(user_info['superfast'])) {
                if(key == 'tier' || key == 'sub_tier') continue;
                db.dbUpdate('RANKS', `${key} = "${value}"`, `tier = "${user_info['ranks']['tier']}" and sub_tier='${user_info['ranks']['sub_tier']}'`);
            }
        } else {
            console.log('Ranks exists');
        }
    } else {
        await insertTFTRanksData(user_info);
        console.log('Ranks data not exists');
    }

    if (user_superfast != undefined) {
        if ((new Date().getTime - user_superfast['date_in_sf']) / 1000 / 60 / 60 >= 12) {
            await insertTFTUserSuperfastData(user_info);
        } else {
            for (const [key, value] of Object.entries(user_info['user_superfast'])) {
                if(key == 'account_id' || key == 'date_in_sf') continue;
                db.dbUpdate(
                    `USER_SUPERFAST AS A, (SELECT * FROM USER_SUPERFAST WHERE account_id="${user_superfast['account_id']}" ORDER BY date_in_sf DESC LIMIT 1) AS B`, 
                    `A.${key} = "${value}"`, 
                    `A.account_id="${user_superfast['account_id']}" and A.date_in_sf=B.date_in_sf`
                );
            }
            console.log('User superfast before 12 hours');
        }
    } else {
        await insertTFTUserSuperfastData(user_info);
        console.log('User superfast not exists');
    }

    if (user_ranks != undefined) {
        if ((new Date().getTime - user_ranks['date_in_ranks']) / 1000 / 60 / 60 >= 12) {
            await insertTFTUserRanksData(user_info);
        } else {
            for (const [key, value] of Object.entries(user_info['user_ranks'])) {
                if(key == 'account_id' || key == 'date_in_ranks') continue;
                db.dbUpdate(
                    `USER_RANKS AS A, (SELECT * FROM USER_RANKS WHERE account_id="${user_ranks['account_id']}" ORDER BY date_in_ranks DESC LIMIT 1) AS B`, 
                    `A.${key} = "${value}"`, 
                    `A.account_id="${user_ranks['account_id']}" and A.date_in_ranks=B.date_in_ranks`
                );
            }
            console.log('User ranks before 12 hours');
        }
    } else {
        await insertTFTUserRanksData(user_info);
        console.log('User ranks not exists');
    }
}

const insertTFTSuperfastData = async (user_info) => {
    let insertData = [Array.from(new Map(Object.entries(user_info['superfast'])).values())];

    try {
        await db.dbInsert('SUPERFAST', insertData);
    } catch (error) {
        console.log(error);
    }
}

const insertTFTRanksData = async (user_info) => {
    let insertData = [Array.from(new Map(Object.entries(user_info['ranks'])).values())];

    try { await db.dbInsert('RANKS', insertData); } catch (error) {
        console.log(error);
    }
}
const insertTFTUserSuperfastData = async (user_info) => {
    let insertData = [Array.from(new Map(Object.entries(user_info['user_superfast'])).values())];

    try { await db.dbInsert('USER_SUPERFAST', insertData); } catch (error) {
        console.log(error);
    }
}

const insertTFTUserRanksData = async (user_info) => {
    let insertData = [Array.from(new Map(Object.entries(user_info['user_ranks'])).values())];

    try { await db.dbInsert('USER_RANKS', insertData); } catch (error) {
        console.log(error);
    }
}

const insertTFTParticipantsData = async () => {
    for (i = 0; i < all_info['user_info'].length; i++) {
        let profile = all_info['user_info'][i]['profile'];
        let user = all_info['user_info'][i]['user'];
        let tier = all_info['user_info'][i];

        await insertTFTProfileData(profile['icon_id'], profile);
        await insertTFTUserData(user['account_id'], user);
        await insertTFTTierData(tier);
    }
}

const insertTFTMatchesData = async (match_info) => {
    for (i = 0; i < match_info['account_id'].length; i++) {
        const [match] = await db.dbSelect('account_id, match_id', 'MATCHES', `account_id="${match_info['account_id'][i]}" and match_id="${match_info['match_id'][i]}"`);

        if (match == undefined) {
            let temp = new Map();
            temp.set('account_id', match_info['account_id'][i]);
            temp.set('match_id', match_info['match_id'][i]);
            temp.set('game_type', match_info['game_type'][i]);
            temp.set('playtime',match_info['playtime'][i].toFixed(5));
            temp.set('placement',match_info['placement'][i]);
            temp.set('left_gold', match_info['left_gold'][i]);
            temp.set('last_round',match_info['last_round'][i]);
            temp.set('levels', match_info['levels'][i]);
            temp.set('playdate',match_info['playdate'][i]);
            temp.set('legends_name',match_info['legends_name'][i]);

            console.log(temp);

            let insertData = [Array.from(temp.values())];

            console.log(insertData);

            try { await db.dbInsert('MATCHES', insertData); } catch (error) {
                console.log(error);
            }
        } else {
            console.log('Match data exists');
        }
    }
}

const insertTFTSynergyData = async (synergy_info) => {
    for (i = 0; i < synergy_info['synergy_name'].length; i++) {
        const [synergy] = await db.dbSelect('*', 'SYNERGY', `synergy_name="${synergy_info['synergy_name'][i]}" and synergy_rank=${synergy_info['synergy_rank'][i]}`);

        if (synergy == undefined) {
            let temp = {};
            
            temp['synergy_name'] = synergy_info['synergy_name'][i];
            temp['synergy_rank'] = synergy_info['synergy_rank'][i];
            temp['synergy_image_path'] = "";
            let insertData = [Array.from(new Map(Object.entries(temp)).values())];

            try { await db.dbInsert('SYNERGY', insertData); } catch (error) {
                console.log(error);
            }
        } else {
            let temp = {};
            temp['synergy_name'] = synergy_info['synergy_name'][i];
            temp['synergy_rank'] = synergy_info['synergy_rank'][i];
            temp['synergy_image_path'] = "";

            if (synergy['synergy_image_path'] != temp['synergy_image_path']) {

                for (const [key, value] of Object.entries(temp)) {
                    if(key == 'synergy_name' || key == 'synergy_rank') continue;
                    db.dbUpdate('SYNERGY', `${key} = "${value}"`, `synergy_name = "${temp['synergy_name']}" and synergy_rank = "${temp['synergy_rank']}"`);
                }
            } else console.log('Synergy data exists');
        }
    }
}

const insertTFTAugmentsData = async (augments_info) => {
    for (i = 0; i < 3; i++) {
        if (augments_info['augments_name'] != null) {
            const [augments] = await db.dbSelect('augments_name', 'AUGMENTS', `augments_name="${augments_info['augments_name'][i]}"`);

            if (augments == undefined) {
                let temp = {};

                temp['augments_name'] = augments_info['augments_name'][i];
                temp['augments_image_path'] = "";

                let insertData = [Array.from(new Map(Object.entries(temp)).values())];

                try { await db.dbInsert('AUGMENTS', insertData); } catch (error) {
                    console.log(error);
                }
            } else {
                let temp = {};

                temp['augments_name'] = augments_info['augments_name'][i];
                temp['augments_image_path'] = "";

                if (augments['augments_image_path'] != temp['augments_image_path']) {
                    
                    for (const [key, value] of Object.entries(temp)) {
                        if(key == 'augments_name') continue;
                        db.dbUpdate('AUGMENTS', `${key} = "${value}"`, `augments_name = "${temp['augments_name']}"`);
                    }
                } else console.log('Augments data exists');
            }
        }
    }
}

const insertTFTLegendsData = async (legends_info) => {
    const [legends] = await db.dbSelect('legends_name', 'LEGENDS', `legends_name="${legends_info['legends_name']}"`);

    if (legends == undefined) {
        let insertData = [Array.from(new Map(Object.entries(legends_info)).values())];

        try { await db.dbInsert('LEGENDS', insertData); } catch (error) {
            console.log(error);
        }
    } else {
        if (legends['legends_image_path'] != legends_info['legends_image_path']) {
            for (const [key, value] of Object.entries(legends_info)) {
                if(key == 'legends_name') continue;
                db.dbUpdate('LEGENDS', `${key} = "${value}"`, `legends_name = "${legends_info['legends_name']}"`);
            }
        } else console.log('Legends data exists');
    }
}

const insertTFTUnitsData = async (units_info) => {
    for (i = 0; i < units_info['units_name'].length; i++) {
        const [units] = await db.dbSelect('units_name, units_rank', 'UNITS', `units_name="${units_info['units_name'][i]}" and units_rank=${units_info['units_rank'][i]}`);

        if (units == undefined) {
            let temp = {};

            temp['units_name'] = units_info['units_name'][i];
            temp['units_rank'] = units_info['units_rank'][i];
            temp['units_cost'] = units_info['units_cost'][i];
            temp['units_image_path'] = "";

            let insertData = [Array.from(new Map(Object.entries(temp)).values())];

            try { await db.dbInsert('UNITS', insertData); } catch (error) {
                console.log(error);
            }
        } else {
            let temp = {};

            temp['units_name'] = units_info['units_name'][i];
            temp['units_rank'] = units_info['units_rank'][i];
            temp['units_cost'] = units_info['units_cost'][i];
            temp['units_image_path'] = "";

            if (units['units_image_path'] != temp['units_image_path']) {
                for (const [key, value] of Object.entries(temp)) {
                    if(key == 'units_name' || key == 'units_rank') continue;
                    db.dbUpdate('UNITS', `${key} = "${value}"`, `units_name = "${temp['units_name']}" and units_rank = "${temp['units_rank']}"`);
                }
            } else console.log('Units data exists');
        }
    }
}

const insertTFTItemsData = async (items_info) => {
    let item_name = [...items_info['item_name']];

    for (i = 0; i < item_name.length; i++) {
        const [items] = await db.dbSelect('item_name', 'ITEMS', `item_name="${item_name[i]}"`);

        if (items == undefined) {
            let temp = {};

            temp['item_name'] = item_name[i];
            temp['item_image_path'] = "";

            let insertData = [Array.from(new Map(Object.entries(temp)).values())];

            try { await db.dbInsert('ITEMS', insertData); } catch (error) {
                console.log(error);
            }
        } else {
            let temp = {};

            temp['item_name'] = item_name[i];
            temp['item_image_path'] = "";

            if (items['items_image_path'] != temp['items_image_path']) {
                for (const [key, value] of Object.entries(temp)) {
                    if(key == 'item_name') continue;
                    db.dbUpdate('ITEMS', `${key} = "${value}"`, `item_name = "${temp['item_name']}"`);
                }
            } else console.log('Items data exists');
        }
    }
}

const insertTFTUnitsInMatchData = async (units_in_match_info) => {
    for (i = 0; i < units_in_match_info['account_id'].length; i++) {
        const [data] = await db.dbSelect('account_id, match_id, used_unit_id', 'UNITS_IN_MATCHES', `account_id="${units_in_match_info['account_id'][i]}" and match_id="${units_in_match_info['match_id'][i]}" and used_unit_id=${units_in_match_info['used_unit_id'][i]}`)

        if (data == undefined) {
            let temp = {};

            temp['account_id'] = units_in_match_info['account_id'][i];
            temp['match_id'] = units_in_match_info['match_id'][i];
            temp['used_unit_id'] = units_in_match_info['used_unit_id'][i];
            temp['units_name'] = units_in_match_info['units_name'][i];
            temp['units_rank'] = units_in_match_info['units_rank'][i];
            temp['item_name1'] = units_in_match_info['item_name1'][i];
            temp['item_name2'] = units_in_match_info['item_name2'][i];
            temp['item_name3'] = units_in_match_info['item_name3'][i];

            let insertData = [Array.from(new Map(Object.entries(temp)).values())];

            try { await db.dbInsert('UNITS_IN_MATCHES', insertData); } catch (error) {
                console.log(error);
            }
        } else {
            console.log('Units in matches data exists');
        }
    }
}

const insertTFTSynergyInMatchData = async (synergy_in_match_info) => {
    for (i = 0; i < synergy_in_match_info['account_id'].length; i++) {
        const [data] = await db.dbSelect('*', 'SYNERGY_IN_MATCHES', 
        `account_id="${synergy_in_match_info['account_id'][i]}" 
        and match_id="${synergy_in_match_info['match_id'][i]}" 
        and synergy_name="${synergy_in_match_info['synergy_name'][i]}"
        and synergy_rank="${synergy_in_match_info['synergy_rank'][i]}"`);

        if (data == undefined) {
            let temp = {};

            temp['account_id'] = synergy_in_match_info['account_id'][i];
            temp['match_id'] = synergy_in_match_info['match_id'][i];
            temp['synergy_name'] = synergy_in_match_info['synergy_name'][i];
            temp['synergy_rank'] = synergy_in_match_info['synergy_rank'][i];

            let insertData = [Array.from(new Map(Object.entries(temp)).values())];

            try { await db.dbInsert('SYNERGY_IN_MATCHES', insertData); } catch (error) {
                console.log(error);
            }
        } else {
            console.log('Synergy in match data exists');
        }
    }
}

const insertTFTAugmentsInMatchData = async (augments_in_match_info) => {
const [data] = await db.dbSelect('*', 'AUGMENTS_IN_MATCHES', `account_id="${augments_in_match_info['account_id']}" and match_id="${augments_in_match_info['match_id']}" and augments_name1="${augments_in_match_info['augments_name1']}" and augments_name2="${augments_in_match_info['augments_name2']}" and augments_name3="${augments_in_match_info['augments_name3']}"`)

        if (data == undefined) {
            let insertData = [Array.from(new Map(Object.entries(augments_in_match_info)).values())];

            try { await db.dbInsert('AUGMENTS_IN_MATCHES', insertData); } catch (error) {
                console.log(error);
            }
        } else {
            console.log('Augments in match data exists');
        }
    }


const insertTFTParticipantsMatchesData = async () => {
    for (k = 0; k < all_info['user_info'].length; k++) {
        await insertTFTLegendsData(all_info['legends_info'][k]);
        await insertTFTAugmentsData(all_info['augments_info'][k]);
        let temp = all_info;
        await insertTFTSynergyData(all_info['synergy_info'][k]);
        await insertTFTItemsData(temp['items_info'][k]);
        let temp2 = temp;
        await insertTFTUnitsData(temp['units_info'][k]);
        await insertTFTMatchesData(temp2['match_info'][k]);
        let temp3 = temp2;
        await insertTFTUnitsInMatchData(temp2['units_in_matches_info'][k]);
        await insertTFTAugmentsInMatchData(all_info['augments_in_matches_info'][k]);
        await insertTFTSynergyInMatchData(temp3['synergy_in_matches_info'][k]);
    }
}

function isString(inputText){
    if(typeof inputText === 'string' || inputText instanceof String){
        //it is string
        return true;    
    }else{
        //it is not string
        return false;
    }
}

exports.initApi = initApi;
exports.insertTFTUserData = insertTFTUserData;
exports.insertTFTProfileData = insertTFTProfileData;
exports.insertTFTTierData = insertTFTTierData;
exports.insertTFTParticipantsData = insertTFTParticipantsData;
exports.insertTFTParticipantsMatchesData = insertTFTParticipantsMatchesData;
// exports.insertTFTSuperfastData = insertTFTSuperfastData;
// exports.insertTFTRanksData = insertTFTRanksData;
// exports.insertTFTUserSuperfastData = insertTFTUserSuperfastData;
// exports.insertTFTUserRanksData = insertTFTUserRanksData;