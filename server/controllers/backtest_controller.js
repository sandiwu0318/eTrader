const Backtest = require("../models/backtest_model");


const getData = async (req, res) => {
    const { periods, symbol, indicator, indicatorPeriod } = req.body;
    const getData = await Backtest.getData(periods, symbol, indicator, indicatorPeriod);
    res.status(200).json({data: getData});
};

const testWithIndicator = async (req, res) => {
    const { periods, symbol, action, volume, indicator, indicatorPeriod, actionValue, actionCross, exitValue, exitCross } = req.body;
    const testWithIndicator = await Backtest.testWithIndicator(periods, symbol, action, volume, indicator, indicatorPeriod, actionValue, actionCross, exitValue, exitCross);
    res.status(200).json({data: testWithIndicator});
};

const testByUserCode = async (req, res) => {
    const { code } = req.body;
    const testByUserCode = await Backtest.testByUserCode(code);
    res.status(200).json({data: testByUserCode});
};


module.exports = {
    getData,
    testWithIndicator,
    testByUserCode
};