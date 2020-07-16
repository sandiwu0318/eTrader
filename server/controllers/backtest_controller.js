const Backtest = require("../models/backtest_model");


const getData = async (req, res) => {
    const { periods, symbols, indicators, indicatorPeriods } = req.body;
    const getData = await Backtest.getData(periods, symbols, indicators, indicatorPeriods);
    res.status(200).json({data: getData});
};

const testWithIndicator = async (req, res) => {
    const { periods, symbols, indicators, indicatorPeriods, actions, actionValues, exitValues, volumes, bbline } = req.body;
    const testWithIndicator = await Backtest.testWithIndicator(periods, symbols, indicators, indicatorPeriods, actions, actionValues, exitValues, volumes, bbline);
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