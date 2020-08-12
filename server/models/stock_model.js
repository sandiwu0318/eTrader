require("dotenv").config();
const {RAPID_API_HOST, RAPID_API_KEY} = process.env;
const axios = require("axios");
const {query, transaction, commit, rollback} = require("../../utils/mysqlcon.js");
const {toThousands, getData, formatedDate} = require("../../utils/util.js");

const getIntradayPrices = async function (symbol) {
    const today = new Date();
    const currentHours = today.getUTCHours();
    const currentMinutes = today.getUTCMinutes();
    let startTime;
    let endTime;
    //Mon-Fri and UTC 13:30-20:00
    if ((currentHours === 13 && currentMinutes >= 30) || (currentHours >=14 && currentHours <= 20) && today.getDay() !== 7 && today.getDay() !== 0) {
        startTime = getTimeForApi(today, 0, 13, 29);
        endTime = Math.floor(today.getTime()/1000);
        //Sun
    } else if (today.getDay() === 0) {
        startTime = getTimeForApi(today, 2, 13, 29);
        endTime = getTimeForApi(today, 2, 20, 1);
        //Mon
    } else if (today.getDay() === 1) {
        startTime = getTimeForApi(today, 3, 13, 29);
        endTime = getTimeForApi(today, 3, 20, 1);
    } else {
        startTime = getTimeForApi(today, 1, 13, 29);
        endTime = getTimeForApi(today, 1, 20, 1);
    }
    const apiPriceData = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?symbol=${symbol}&period1=${startTime}&period2=${endTime}&interval=1m&includePrePost=true&events=div%7Csplit%7Cearn&lang=en-US&region=US&crumb=s4kSXO9kdhY&corsDomain=finance.yahoo.com`);
    let priceData;
    if (apiPriceData.data.chart.result[0].timestamp === undefined) {
        return {error: "Unavailable to get the data now"};
    } else {
        const priceResult = apiPriceData.data.chart.result[0];
        priceData = {
            currentPrice: priceResult.meta.regularMarketPrice,
            times: priceResult.timestamp.map(i => new Date((i-14400)*1000)),
            prices: priceResult.indicators.quote[0].close,
            volumes: priceResult.indicators.quote[0].volume,
        };
    }
    fillTheEmptyNum(priceData, "prices");
    fillTheEmptyNum(priceData, "volumes");
    return priceData;
};


//Get prices for 1 month above
const getPrices = async function (symbol, frequency) {
    const current = Math.floor(new Date().getTime());
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
    //Select from database first, if no data then call API
    const startDate = formatedDate(new Date(current-(1000*60*60*24*30*month)).toISOString());
    const selectStr = "SELECT DISTINCT(time), price, volume FROM stock_price WHERE symbol=? AND time >= ? ORDER BY time";
    const databasePriceData = await query(selectStr, [symbol, startDate]);
    let priceData;
    if (databasePriceData.length === 0) {
        const apiPriceData = (await getApiPrices(symbol)).filter(i => i.date >= current/1000-(60*60*24*30*month));
        priceData = {
            times: apiPriceData.map(i => formatedDate(new Date(i.date*1000).toISOString())),
            prices: apiPriceData.map(i => i.close),
            volumes: apiPriceData.map(i => i.volume),
        };
    } else {
        priceData = {
            times: databasePriceData.map(i => formatedDate(new Date(i.time.getTime()+1000*60*60*24).toISOString())),
            prices: databasePriceData.map(i => i.price),
            volumes: databasePriceData.map(i => i.volume),
        };
    }
    return priceData;
};

const getBasicInfo = async function (symbol) {
    const selectStr = "SELECT * FROM stock_basicInfo WHERE symbol=?";
    const databaseBasicInfoData = await query(selectStr, [symbol]);
    let basicInfoRawData;
    //Select from database first, if no data then call API
    if (databaseBasicInfoData.length === 0) {
        basicInfoRawData = await getApiBasicInfo(symbol);
    } else {
        basicInfoRawData = databaseBasicInfoData[0];
    }
    const basicInfoData = {
        Symbol: basicInfoRawData.symbol,
        "Previous Closing": basicInfoRawData.prev_close,
        "Day Range": basicInfoRawData.day_range,
        "Average Volume": toThousands(basicInfoRawData.average_volume),
        "Annual Return": basicInfoRawData.annual_return,
        "Beta": basicInfoRawData.beta,
        "Market Cap": toThousands(basicInfoRawData.market_cap),
        "EPS": basicInfoRawData.eps,
        "PE Ration": basicInfoRawData.pe_ration,
        "Dividend": basicInfoRawData.dividend,
    };
    if (basicInfoRawData.financial_chart) {
        basicInfoData.financialChart = JSON.parse(basicInfoRawData.financial_chart);
    }
    if (basicInfoRawData.profile) {
        basicInfoData.profile = {
            Sector: JSON.parse(basicInfoRawData.profile).sector || null,
            Industry: JSON.parse(basicInfoRawData.profile).industry || null,
            Country: JSON.parse(basicInfoRawData.profile).country || null,
            City: JSON.parse(basicInfoRawData.profile).city || null,
            State: JSON.parse(basicInfoRawData.profile).state || null,
            Employees: toThousands(JSON.parse(basicInfoRawData.profile).fullTimeEmployees) || null,
            Website: JSON.parse(basicInfoRawData.profile).website || null,
            longBusinessSummary: JSON.parse(basicInfoRawData.profile).longBusinessSummary || null
        };
    }
    return basicInfoData;
};

const getNews = async function (symbol) {
    const selectStr = "SELECT title, link, author, time FROM stock_news WHERE symbol=?";
    const databaseNewsData = await query(selectStr, [symbol]);
    let newsData;
    //Select from database first, if no data then call API
    if (databaseNewsData.length === 0) {
        const apiNewsData = await getApiNews(symbol);
        newsData = apiNewsData.map(i => ({
            title: i.title,
            link: i.link,
            author: i.author,
            time: formatedDate(new Date(i.published_at*1000).toISOString())
        }));
    } else {
        newsData = databaseNewsData;
    }
    return newsData;
};

const getApiPrices = async function (symbol) {
    const current = Math.floor(new Date().getTime()/1000);
    const config = {
        "headers":{
            "x-rapidapi-host":RAPID_API_HOST,
            "x-rapidapi-key":RAPID_API_KEY,
            "useQueryString":true
        }, "params":{
            "frequency":"1d",
            "filter":"history",
            "period1":0,
            "period2":current,
            "symbol":symbol
        },
    };
    const apiPriceData = await axios.get("https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-historical-data", config);
    const priceData = apiPriceData.data.prices.map(i => 
        [symbol, formatedDate(new Date(i.date*1000).toISOString()), i.close, i.volume]
    );
    if (priceData.length !== 0) {
        const insertStr = "INSERT INTO stock_price (symbol, time, price, volume) VALUES ?";
        await query(insertStr, [priceData]);
        return apiPriceData.data.prices;
    }
};

const getApiBasicInfo = async function (symbol) {
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
    const apiBasicInfoData = (await axios.get("https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-summary", config)).data;
    let basicInfoData = {
        symbol: symbol,
        prev_close: getData(apiBasicInfoData, "price", "regularMarketPreviousClose").raw || null,
        day_range: `${getData(apiBasicInfoData, "price", "regularMarketDayLow").raw} - ${getData(apiBasicInfoData, "price", "regularMarketDayHigh").raw}` || null,
        average_volume: getData(apiBasicInfoData, "price", "averageDailyVolume3Month").raw  || null,
        annual_return: getData(apiBasicInfoData, "summaryDetail", "ytdReturn").raw || null,
        beta: getData(apiBasicInfoData, "summaryDetail", "beta").raw || null,
        market_cap: getData(apiBasicInfoData, "defaultKeyStatistics", "enterpriseValue").raw || null,
        eps: getData(apiBasicInfoData, "defaultKeyStatistics", "trailingEps").raw || null,
        pe_ration: getData(apiBasicInfoData, "price", "regularMarketPrice").raw / getData(apiBasicInfoData, "defaultKeyStatistics", "trailingEps").raw || null,
        dividend: getData(apiBasicInfoData, "summaryDetail", "dividendYield").raw || null,
    };
    if (getData(apiBasicInfoData, "earnings", "financialsChart")) {
        basicInfoData.financial_chart = JSON.stringify(getData(apiBasicInfoData, "earnings", "financialsChart"));
    }
    if (apiBasicInfoData.summaryProfile) {
        basicInfoData.profile = JSON.stringify(apiBasicInfoData.summaryProfile);
    }
    const insertStr = "INSERT INTO stock_basicInfo SET ?";
    await query(insertStr, [basicInfoData]);
    return basicInfoData;
};

const getApiNews = async function (symbol) {
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
    const apiNewsData = await axios.get("https://apidojo-yahoo-finance-v1.p.rapidapi.com/news/list", config);
    const lastestTenNews = apiNewsData.data.items.result.slice(0, 10);
    const InsertNewsData = lastestTenNews.map(i => 
        [symbol, i.title, i.link, i.author, formatedDate(new Date(i.published_at*1000).toISOString())]
    );
    try {
        const deleteStr = "DELETE FROM stock_news WHERE symbol=?";
        const insertStr = "INSERT INTO stock_news (symbol, title, link, author, time) VALUES ?";
        await transaction();
        await query(deleteStr, [symbol]);
        await query(insertStr, [InsertNewsData]);
        await commit();
        return lastestTenNews;
    } catch(error) {
        await rollback();
        throw error;
    }
};

const getSymbolList = async function () {
    const selectStr = "SELECT symbol, name FROM stock_symbol ORDER BY symbol";
    const symbols = await query(selectStr, []);
    return symbols;
};

//Daily CronJob
const getDailyPrices = async function () {
    const selectStr = "SELECT DISTINCT(symbol) FROM stock_price";
    const symbols = (await query(selectStr, [])).map(i => i.symbol);
    for (let symbol of symbols) {
        // const startTime = Math.floor((new Date()).getTime()/1000-60*60*24);
        const startTime = 0;
        const current = Math.floor(new Date().getTime()/1000);
        const config = {
            "headers":{
                "x-rapidapi-host":RAPID_API_HOST,
                "x-rapidapi-key":RAPID_API_KEY,
                "useQueryString":true
            }, "params":{
                "frequency":"1d",
                "filter":"history",
                "period1":startTime,
                "period2":current,
                "symbol": symbol
            },
        };
        const apiPriceData = await axios.get("https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-historical-data", config);
        console.log(apiPriceData);
        const insertPriceData = apiPriceData.data.prices.map(i => 
            [symbol, formatedDate(new Date(i.date*1000).toISOString()), i.close, i.volume]
        );
        if (insertPriceData.length !== 0) {
            const insertStr = "INSERT INTO stock_price (symbol, time, price, volume) VALUES ?";
            await query(insertStr, [insertPriceData]);
        }
    }
    return;
};

//Daily CronJob
const getDailyBasicInfo = async function () {
    const selectStr = "SELECT DISTINCT(symbol) FROM stock_basicInfo";
    const symbols = (await query(selectStr, [])).map(i => i.symbol);
    let count = 0;
    //Limit: 5 calls per second for RapidAPI
    setInterval(async function() {
        if (count < symbols.length) {
            try {
                const deleteStr = "DELETE FROM stock_basicInfo WHERE symbol = ?";
                await transaction();
                await query(deleteStr, [symbols[count]]);
                getApiBasicInfo(symbols[count]);
                await commit();
            } catch(error) {
                await rollback();
                throw error;
            }
            count++;
        }
    }, 1000);
    return;
};

//Daily CronJob
const getDailyNews = async function () {
    const selectStr = "SELECT DISTINCT(symbol) FROM stock_news";
    const symbols = (await query(selectStr, [])).map(i => i.symbol);
    let count = 0;
    //Limit: 5 calls per second for RapidAPI
    setInterval(async function() {
        if (count < symbols.length) {
            try {
                const deleteStr = "DELETE FROM stock_news WHERE symbol=?";
                await transaction();
                await query(deleteStr, [symbols[count]]);
                getApiNews(symbols[count]);
                await commit();
            } catch(error) {
                await rollback();
                throw error;
            }
            count++;
        }
    }, 1000);
    return;
};

//Function for getIntradayPrices
const getTimeForApi = function(today, minusDays, hour, minute) {
    return Math.floor(new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()-minusDays, hour, minute)).getTime()/1000);
};

//Function for getIntradayPrices
const fillTheEmptyNum = function(data, title) {
    for (let i =0; i<data[title].length; i++) {
        if (data[title][i] === null) {
            data[title][i] = data[title][i-1];
        }
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
    getSymbolList,
    getDailyPrices,
    getDailyBasicInfo,
    getDailyNews
};