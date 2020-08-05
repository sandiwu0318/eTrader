const Stock = require("../models/stock_model");


const getIntradayPrices = async (req, res) => {
    const { symbol, close } = req.query;
    const intradayPrices = await Stock.getIntradayPrices(symbol, close);
    res.status(200).json({data: intradayPrices});
};

const getPrices = async (req, res) => {
    const { symbol, frequency } = req.query;
    const prices = await Stock.getPrices(symbol, frequency);
    res.status(200).json({data: prices});
};

const getBasicInfo = async (req, res) => {
    const { symbol } = req.query;
    const basicInfo = await Stock.getBasicInfo(symbol);
    res.status(200).json({data: basicInfo});
};

const getNews = async (req, res) => {
    const { symbol } = req.query;
    const news = await Stock.getNews(symbol);
    res.status(200).json({data: news});
};

const getApiPrices = async (req, res) => {
    const { symbol } = req.query;
    const apiPrices = await Stock.getApiPrices(symbol);
    res.status(200).json({data: apiPrices});
};

const getApiBasicInfo = async (req, res) => {
    const { symbol } = req.query;
    const apiBasicInfo = await Stock.getApiBasicInfo(symbol);
    res.status(200).json({data: apiBasicInfo});
};

const getApiNews = async (req, res) => {
    const { symbol } = req.query;
    const apiNews = await Stock.getApiNews(symbol);
    res.status(200).json({data: apiNews});
};

const getSymbolList = async (req, res) => {
    const symbolList = await Stock.getSymbolList();
    res.status(200).json({data: symbolList});
};

const getDailyPrices = async (req, res) => {
    const dailyPrices = await Stock.getDailyPrices();
    res.status(200).json({data: dailyPrices});
};

const getDailyNews = async (req, res) => {
    const dailyNews = await Stock.getDailyNews();
    res.status(200).json({data: dailyNews});
};

const getDailyBasicInfo = async (req, res) => {
    const dailyBasicInfo = await Stock.getDailyBasicInfo();
    res.status(200).json({data: dailyBasicInfo});
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
    getDailyNews,
    getDailyBasicInfo
};