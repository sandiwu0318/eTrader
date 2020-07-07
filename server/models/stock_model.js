require("dotenv").config();
const {RAPID_API_HOST, RAPID_API_KEY, ALPHAVANTAGE_API_KEY} = process.env;
const axios = require("axios");
const {query, transaction, commit, rollback} = require("../../utils/mysqlcon.js");

const getIntradayPrices = async function (symbol, io) {
    async function getData() {
        try {
            const today = new Date();
            const hours = today.getUTCHours();
            const minutes = today.getUTCMinutes();
            let period1;
            let period2;
            if ((hours === 13 && minutes >= 30) || (hours >=14 && hours <= 20)) {
                console.log("here");
                period1 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 21, 30).getTime()/1000;
                period2 = today.getTime()/1000;
            } else {
                period1 = new Date(today.getFullYear(), today.getMonth(), today.getDate()-1, 21, 30).getTime()/1000;
                period2 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 4).getTime()/1000;
            }
            const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?symbol=${symbol}&period1=${period1}&period2=${period2}&interval=1m&includePrePost=true&events=div%7Csplit%7Cearn&lang=en-US&region=US&crumb=s4kSXO9kdhY&corsDomain=finance.yahoo.com`);
            const data = {
                times: response.data.chart.result[0].timestamp.map(i => new Date((i-14400)*1000)),
                prices: response.data.chart.result[0].indicators.quote[0].close,
                volumes: response.data.chart.result[0].indicators.quote[0].volume,
            };
            // console.log("data", data);
            io.emit("intraday", data);
        } catch(error) {
            console.log(error);
            return "Error when retrieving intraday price";
        }
    }  
    getData();
    setInterval(() => getData(), 20000);
};

const getPrices = async function (symbol, frequency) {
    const today = Math.floor(new Date().getTime());
    let month;
    switch (frequency) {
    case "1mo":
        month = 1;
        break;
    case "3mo":
        month = 3;    
        break;
    case "6mo":
        month = 6;
        break;
    case "1yr":
        month = 12;
        break;
    case "3yr":
        month = 12*3;
        break;
    case "max":
        month = 12*50;
        break;
    }
    const startDate = new Date(today-(1000*60*60*24*30*month)).toISOString().substr(0, 10);
    try {
        const selectStr = "SELECT time, price, volume FROM stock_price WHERE symbol=? AND time >= ?";
        await transaction();
        const result = await query(selectStr, [symbol, startDate]);
        await commit();
        if (result.length === 0) {
            const prices = (await getApiPrices(symbol, 0)).filter(i => i.date >= today/1000-(60*60*24*30*month));
            const formatPrices = {
                times: prices.map(i => new Date(i.date*1000).toISOString().substr(0, 10)),
                prices: prices.map(i => i.close),
                volumes: prices.map(i => i.volume),
            };
            return formatPrices;
        } else {
            return {
                times: result.map(i => i.time.toISOString().substr(0, 10)),
                prices: result.map(i => i.price),
                volumes: result.map(i => i.volume),
            };
        }
    } catch(error) {
        await rollback();
        console.log(error);
        return "Error when retrieving stock price";
    }
};

const getBasicInfo = async function (symbol) {
    try {
        const selectStr = "SELECT * FROM stock_basicInfo WHERE symbol=?";
        await transaction();
        const result = await query(selectStr, [symbol]);
        await commit();
        if (result.length === 0) {
            const basicInfo = await getApiBasicInfo(symbol);
            return basicInfo;
        } else {
            return {
                symbol: result[0].symbol,
                prevClose: result[0].prevClose,
                dayRange: result[0].dayRange,
                averageVolume: result[0].averageVolume,
                annualReturn: result[0].annualReturn,
                beta: result[0].beta,
                marketCap: result[0].marketCap,
                eps: result[0].eps,
                peRation: result[0].peRation,
                dividend: result[0].dividend,
                financialChart: JSON.parse(result[0].financialChart),
                profile: JSON.parse(result[0].profile),
            };
        }
    } catch(error) {
        await rollback();
        console.log(error);
        return "Error when retrieving stock basic info";
    }
};

const getNews = async function (symbol) {
    try {
        const selectStr = "SELECT title, link, author, time FROM stock_news WHERE symbol=?";
        await transaction();
        const result = await query(selectStr, [symbol]);
        await commit();
        if (result.length === 0) {
            const news = await getApiNews(symbol);
            const formatNews = news.map(i => ({
                title: i.title,
                link: i.link,
                author: i.author,
                time: (new Date(i.published_at*1000)).toISOString().substr(0, 10)
            }));
            return formatNews;
        } else {
            return result;
        }
    } catch(error) {
        await rollback();
        console.log(error);
        return "Error when retrieving stock basic info";
    }
};

const getApiPrices = async function (symbol, oneday) {
    let period1;
    if (oneday === 0) {
        period1 = 0;
    } else {
        period1 = Math.floor((new Date()).getTime()/1000-60*60*24);
    }
    const now = Math.floor(new Date().getTime()/1000);
    const config = {
        "headers":{
            "x-rapidapi-host":RAPID_API_HOST,
            "x-rapidapi-key":RAPID_API_KEY,
            "useQueryString":true
        }, "params":{
            "frequency":"1d",
            "filter":"history",
            "period1":period1,
            "period2":now,
            "symbol":symbol
        },
    };
    try {
        const response = await axios.get("https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-historical-data", config);
        const queryArr = response.data.prices.map(i => 
            [symbol, (new Date(i.date*1000)).toISOString().substr(0, 10), i.close, i.volume]
        );
        if (queryArr.length !== 0) {
            const insertStr = "INSERT INTO stock_price (symbol, time, price, volume) VALUES ?";
            await transaction();
            await query(insertStr, [queryArr]);
            await commit();
            return response.data.prices;
        }
    } catch(error) {
        await rollback();
        console.log(error);
        return "Error when retrieving API stock price";
    }
};

const getApiBasicInfo = async function (symbol) {
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
        let data = {
            symbol: symbol,
            prevClose: getData("price", "regularMarketPreviousClose").raw,
            dayRange: `${getData("price", "regularMarketDayLow").raw} - ${getData("price", "regularMarketDayHigh").raw}`,
            averageVolume: getData("price", "averageDailyVolume3Month").raw,
            annualReturn: getData("summaryDetail", "ytdReturn").raw,
            beta: getData("summaryDetail", "beta").raw,
            marketCap: getData("defaultKeyStatistics", "enterpriseValue").raw,
            eps: getData("defaultKeyStatistics", "trailingEps").raw,
            peRation: getData("price", "regularMarketPrice").raw / getData("defaultKeyStatistics", "trailingEps").raw,
            dividend: getData("summaryDetail", "dividendYield").raw,
            financialChart: JSON.stringify(getData("earnings", "financialsChart")),
            profile: JSON.stringify(response.data.summaryProfile),
        };
        const insertStr = "INSERT INTO stock_basicInfo SET ?";
        await transaction();
        await query(insertStr, [data]);
        await commit();
        data.financialChart = getData("earnings", "financialsChart");
        data.profile = response.data.summaryProfile;
        return data;
    } catch(error) {
        await rollback();
        console.log(error);
        return "Error when retrieving API basic info";
    }
};

const getApiNews = async function (symbol) {
    try {
        const config = {
            "headers":{
                "x-rapidapi-host":RAPID_API_HOST,
                "x-rapidapi-key":RAPID_API_KEY,
                "useQueryString":true
            }, "params":{
                "category":symbol,
                "region":"US"
            }
        };
        const response = await axios.get("https://apidojo-yahoo-finance-v1.p.rapidapi.com/news/list", config);
        const shortRes = response.data.items.result.slice(0, 10);
        const data = shortRes.map(i => 
            [symbol, i.title, i.link, i.author, (new Date(i.published_at*1000)).toISOString().substr(0, 10)]
        );
        const deleteStr = "DELETE FROM stock_news WHERE symbol=?";
        const insertStr = "INSERT INTO stock_news (symbol, title, link, author, time) VALUES ?";
        await transaction();
        await query(deleteStr, [symbol]);
        await query(insertStr, [data]);
        await commit();
        return shortRes;
    } catch(error) {
        await rollback();
        console.log(error);
        return "Error when retrieving API news";
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
    getIntradayPrices,
    getPrices,
    getBasicInfo,
    getNews,
    getApiPrices,
    getApiBasicInfo,
    getApiNews,
    symbolSearch
};