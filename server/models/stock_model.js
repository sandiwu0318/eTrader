require("dotenv").config();
const {RAPID_API_HOST, RAPID_API_KEY, ALPHAVANTAGE_API_KEY} = process.env;
const axios = require("axios");

const getStockPrice = async function (symbol, frequency) {
    const today = new Date();
    const period2 = Math.floor(today.getTime()/1000);
    let frequencyParams;
    let period1;
    if (frequency === "1d") {
        try {
            const response = await axios.get(`https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${ALPHAVANTAGE_API_KEY}`);
            const timeArr = Object.keys(response.data["Time Series (5min)"]);
            const priceArr = Object.values(response.data["Time Series (5min)"]).map(i => i["4. close"]);
            const volumeArr = Object.values(response.data["Time Series (5min)"]).map(i => i["5. volume"]);
            return {
                times: timeArr,
                prices: priceArr,
                volumes: volumeArr
            };  
        } catch(error) {
            console.log(error);
            return "Error when retrieving stock price";
        }
    } else {
        switch (frequency) {
        case "1mo":
            console.log("here");    
            frequencyParams = "1d";
            period1 = period2-(60*60*24*30);
            break;
        case "3mo":
            frequencyParams = "1d";
            period1 = period2-(60*60*24*30*3);
            break;
        case "6mo":
            frequencyParams = "1d";
            period1 = period2-(60*60*24*30*6);
            break;
        case "1yr":
            frequencyParams = "1d";
            period1 = period2-(60*60*24*30*12);
            break;
        case "3yr":
            frequencyParams = "1wk";
            period1 = period2-(60*60*24*30*12*3);
            break;
        case "max":
            frequencyParams = "1wk";
            period1 = 0;
            break;
        }
        
        const config = {
            "headers":{
                "x-rapidapi-host":RAPID_API_HOST,
                "x-rapidapi-key":RAPID_API_KEY,
                "useQueryString":true
            }, "params":{
                "frequency":frequencyParams,
                "filter":"history",
                "period1":period1,
                "period2":period2,
                "symbol":symbol
            }
        };
        try {
            const response = await axios.get("https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-historical-data", config);
            return {
                times: response.data.prices.map(i => new Date(i.date*1000)),
                prices: response.data.prices.map(i => i.close),
                volumes: response.data.prices.map(i => i.volume)
            };
                
        } catch(error) {
            console.log(error);
            return "Error when retrieving stock price";
        }
    }
    
};

const getBasicInfo = async function (symbol) {
    try {
        const config = {
            "headers":{
                "x-rapidapi-host":RAPID_API_HOST,
                "x-rapidapi-key":RAPID_API_KEY,
                "useQueryString":true
            }, "params":{
                "symbol":symbol,
                "region":"US"
            }
        };
        const response = await axios.get("https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-summary", config);
        const getData = function(category, name) {
            return response.data[category][name];
        };
        return {
            prevClose: getData("price", "regularMarketPreviousClose").raw,
            dayRange: [getData("price", "regularMarketDayLow").raw, getData("price", "regularMarketDayHigh").raw],
            averageVolume: getData("price", "averageDailyVolume3Month").raw,
            annualReturn: getData("summaryDetail", "ytdReturn"),
            beta: getData("summaryDetail", "beta").raw,
            marketCap: getData("defaultKeyStatistics", "enterpriseValue").raw,
            eps: getData("defaultKeyStatistics", "trailingEps").raw,
            financialChart: getData("earnings", "financialsChart"),
            peRation: getData("price", "regularMarketPrice").raw / getData("defaultKeyStatistics", "trailingEps").raw,
            dividend: getData("summaryDetail", "dividendYield"),
            profile: response.data.summaryProfile,
        };    
    } catch(error) {
        console.log(error);
        return "Error when retrieving stock price";
    }
};

const symbolSearch = async function (symbol) {
    try {
        const response = await axios.get(`https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${symbol}&apikey=${ALPHAVANTAGE_API_KEY}`);
        return response.data.bestMatches;
    } catch(error) {
        console.log(error);
        return "Error when retrieving symbol";
    }
};



module.exports = {
    getStockPrice,
    getBasicInfo,
    symbolSearch
};