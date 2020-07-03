const Backtest = require("../models/backtest_model");


const getData = async (req, res) => {
    const { periods, symbols } = req.body;
    const getData = await Backtest.getData(periods, symbols);
    res.status(200).json({data: getData});
};

// const getBasicInfo = async (req, res) => {
//     const { symbol } = req.query;
//     const basicInfo = await Stock.getBasicInfo(symbol);
//     res.status(200).json({data: basicInfo});
// };

module.exports = {
    getData,
    
};