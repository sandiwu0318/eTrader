const Backtest = require("../models/backtest_model");


const showIndicatorData = async (req, res) => {
    const { periods, symbol, indicator, indicatorPeriod } = req.body;
    const indicatorData = await Backtest.showIndicatorData(periods, symbol, indicator, indicatorPeriod);
    res.status(200).json({data: indicatorData});
};

const testWithIndicator = async (req, res) => {
    const { periods, symbol, action, volume, indicator, indicatorPeriod, actionValue, actionCross, exitValue, exitCross } = req.body;
    const testWithIndicatorResults = await Backtest.testWithIndicator(periods, symbol, action, volume, indicator, indicatorPeriod, actionValue, actionCross, exitValue, exitCross);
    res.status(200).json({data: testWithIndicatorResults});
};

const saveBacktestResult = async (req, res) => {
    const { periods, symbol, action, volume, indicator, indicatorPeriod, actionValue, actionCross, exitValue, exitCross, investmentReturn, ROI } = req.body;
    const token = req.get("Authorization");
    const backtestResult = await Backtest.saveBacktestResult(token, periods, symbol, action, volume, indicator, indicatorPeriod, actionValue, actionCross, exitValue, exitCross, investmentReturn, ROI);
    if (backtestResult.error === "Wrong authentication") {
        res.status(400).json({data: {
            error: "Wrong authentication"
        }});
    } else {
        res.status(200).json({data: backtestResult});
    }
};

const getSavedResults = async (req, res) => {
    const token = req.get("Authorization");
    const savedResults = await Backtest.getSavedResults(token);
    if (savedResults.error === "Wrong authentication") {
        res.status(400).json({data: {
            error: "Wrong authentication"
        }});
    } else {
        res.status(200).json({data: savedResults});
    }
};




module.exports = {
    showIndicatorData,
    testWithIndicator,
    saveBacktestResult,
    getSavedResults
};