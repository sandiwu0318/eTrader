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

const saveBacktestResult = async (req, res) => {
    const { token, periods, symbol, action, volume, indicator, indicatorPeriod, actionValue, actionCross, exitValue, exitCross, investmentReturn, ROI } = req.body;
    const saveBacktestResult = await Backtest.saveBacktestResult(token, periods, symbol, action, volume, indicator, indicatorPeriod, actionValue, actionCross, exitValue, exitCross, investmentReturn, ROI);
    res.status(200).json({data: saveBacktestResult});
};

const getSavedResults = async (req, res) => {
    const { token } = req.body;
    const getSavedResults = await Backtest.getSavedResults(token);
    res.status(200).json({data: getSavedResults});
};




module.exports = {
    getData,
    testWithIndicator,
    saveBacktestResult,
    getSavedResults
};