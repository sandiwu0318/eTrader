require("dotenv").config();
const {RAPID_API_HOST, RAPID_API_KEY} = process.env;
const axios = require("axios");

const getData = async function (periods, symbols) {
    console.log(periods);
    console.log(symbols);
    try {
        let dataSet = [];
        for (let i of symbols) {
            const config = {
                "headers":{
                    "x-rapidapi-host":RAPID_API_HOST,
                    "x-rapidapi-key":RAPID_API_KEY,
                    "useQueryString":true
                }, "params":{
                    "frequency":"1d",
                    "filter":"history",
                    "period1":new Date(periods[0]).getTime()/1000,
                    "period2":new Date(periods[1]).getTime()/1000,
                    "symbol":i
                }
            };
            const response = await axios.get("https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-historical-data", config);
            const data = {
                symbol: i,
                times: response.data.prices.map(i => new Date(i.date*1000)),
                prices: response.data.prices.map(i => i.close),
            };
            dataSet.push(data);
        }
        return dataSet;
    } catch(error) {
        console.log(error);
        return "Error when retrieving stock price";
    }
};

// const getBasicInfo = async function (symbol) {
//     try {
//         const config = {
//             "headers":{
//                 "x-rapidapi-host":RAPID_API_HOST,
//                 "x-rapidapi-key":RAPID_API_KEY,
//                 "useQueryString":true
//             }, "params":{
//                 "symbol":symbol,
//                 "region":"US"
//             }
//         };
//         const response = await axios.get("https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-summary", config);
//         const getData = function(category, name) {
//             return response.data[category][name];
//         };
//         return {
//             prevClose: getData("price", "regularMarketPreviousClose").raw,
//             dayRange: `${getData("price", "regularMarketDayLow").raw} - ${getData("price", "regularMarketDayHigh").raw}`,
//             averageVolume: getData("price", "averageDailyVolume3Month").raw,
//             annualReturn: getData("summaryDetail", "ytdReturn").raw,
//             beta: getData("summaryDetail", "beta").raw,
//             marketCap: getData("defaultKeyStatistics", "enterpriseValue").raw,
//             eps: getData("defaultKeyStatistics", "trailingEps").raw,
//             peRation: getData("price", "regularMarketPrice").raw / getData("defaultKeyStatistics", "trailingEps").raw,
//             dividend: getData("summaryDetail", "dividendYield").raw,
//             financialChart: getData("earnings", "financialsChart"),
//             profile: response.data.summaryProfile,
//         };    
//     } catch(error) {
//         console.log(error);
//         return "Error when retrieving stock price";
//     }
// };



module.exports = {
    getData
};