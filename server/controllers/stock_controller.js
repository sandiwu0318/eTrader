const Stock = require("../models/stock_model");


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

const getDailyPrices = async () => {
    await Stock.getDailyPrices();
};

const getDailyNews = async () => {
    await Stock.getDailyNews();
};

const getDailyBasicInfo = async () => {
    await Stock.getDailyBasicInfo();
};


module.exports = {
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