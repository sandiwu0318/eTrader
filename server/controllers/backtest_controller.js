const Backtest = require("../models/backtest_model");


const getData = async (req, res) => {
    const { periods, symbols } = req.body;
    const getData = await Backtest.getData(periods, symbols);
    res.status(200).json({data: getData});
};

const testWithPrices = async (req, res) => {
    const { periods, symbols, actions, prices, exitPrices, volumes } = req.body;
    const testWithPrices = await Backtest.testWithPrices(periods, symbols, actions, prices, exitPrices, volumes);
    res.status(200).json({data: testWithPrices});
};

const testWithIndicator = async (req, res) => {
    const { periods, symbols, indicators, indicatorPeriods, actions, actionValues, exitValues, volumes } = req.body;
    const testWithIndicator = await Backtest.testWithIndicator(periods, symbols, indicators, indicatorPeriods, actions, actionValues, exitValues, volumes);
    res.status(200).json({data: testWithIndicator});
};


module.exports = {
    getData,
    testWithPrices,
    testWithIndicator
};