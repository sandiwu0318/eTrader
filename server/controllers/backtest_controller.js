const Backtest = require("../models/backtest_model");


const getData = async (req, res) => {
    const { periods, symbols } = req.body;
    const getData = await Backtest.getData(periods, symbols);
    res.status(200).json({data: getData});
};

const getResult = async (req, res) => {
    console.log(req.body);
    const { periods, symbols, actions, prices, exitPrices, volumes } = req.body;
    const getResult = await Backtest.getResult(periods, symbols, actions, prices, exitPrices, volumes);
    res.status(200).json({data: getResult});
};

module.exports = {
    getData,
    getResult
};