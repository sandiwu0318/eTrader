const Stock = require("../models/stock_model");


const getIntradayPrices = async (req, res) => {
    const { symbol, close } = req.query;
    const { io } = req;
    const intradayPrices = await Stock.getIntradayPrices(symbol, close, io);
    res.status(200).json({data: intradayPrices});
};

const getPrices = async (req, res) => {
    const { symbol, frequency } = req.query;
    const prices = await Stock.getPrices(symbol, frequency);
    res.status(200).json({data: prices});
};

const getApiPrices = async (req, res) => {
    const { symbol } = req.query;
    const apiPrices = await Stock.getApiPrices(symbol);
    res.status(200).json({data: apiPrices});
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

const getApiBasicInfo = async (req, res) => {
    const { symbol } = req.query;
    const apiBasicInfo = await Stock.getApiBasicInfo(symbol);
    res.status(200).json({data: apiBasicInfo});
};

const getApiNews = async (req, res) => {
    const { symbol } = req.query;
    const news = await Stock.getApiNews(symbol);
    res.status(200).json({data: news});
};

const symbolList = async (req, res) => {
    const symbolList = await Stock.symbolList();
    res.status(200).json({data: symbolList});
};

const dailyGetPrices = async (req, res) => {
    const dailyGetPrices = await Stock.dailyGetPrices();
    res.status(200).json({data: dailyGetPrices});
};

const dailyGetNews = async (req, res) => {
    const dailyGetNews = await Stock.dailyGetNews();
    res.status(200).json({data: dailyGetNews});
};


module.exports = {
    getIntradayPrices,
    getPrices,
    getBasicInfo,
    getNews,
    getApiPrices,
    getApiBasicInfo,
    getApiNews,
    symbolList,
    dailyGetPrices,
    dailyGetNews
};