const Stock = require("../models/stock_model");


const getStockPrice = async (req, res) => {
    const { symbol, frequency } = req.query;
    const stockPrice = await Stock.getStockPrice(symbol, frequency);
    res.status(200).json({data: stockPrice});
};

const getBasicInfo = async (req, res) => {
    const { symbol } = req.query;
    const basicInfo = await Stock.getBasicInfo(symbol);
    res.status(200).json({data: basicInfo});
};

const getNews = async (req, res) => {
    const { symbol } = req.query;
    const getNews = await Stock.getNews(symbol);
    res.status(200).json({data: getNews});
};

const symbolSearch = async (req, res) => {
    const { symbol } = req.query;
    const symbolSearch = await Stock.symbolSearch(symbol);
    res.status(200).json({data: symbolSearch});
};

module.exports = {
    getStockPrice,
    getBasicInfo,
    getNews,
    symbolSearch
};