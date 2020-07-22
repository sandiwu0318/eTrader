const Trade = require("../models/trade_model");


const setOrder = async (req, res) => {
    const { token, symbol, category, value, indicatorPeriod, cross, volume, action, period } = req.body;
    const setOrder = await Trade.setOrder(token, symbol, category, value, indicatorPeriod, cross, volume, action, period);
    res.status(200).json({data: setOrder});
};

const matchPriceOrders = async () => {
    await Trade.matchPriceOrders();
};

const matchIndicatorOrders = async () => {
    await Trade.matchIndicatorOrders();
};

module.exports = {
    setOrder,
    matchPriceOrders,
    matchIndicatorOrders
};