const Trade = require("../models/trade_model");


const setOrder = async (req, res) => {
    const { symbol, indicator, value, indicatorPeriod, cross, volume, action, sub_action, period } = req.body;
    const token = req.get("Authorization");
    const setOrder = await Trade.setOrder(token, symbol, indicator, value, indicatorPeriod, cross, volume, action, sub_action, period);
    res.status(200).json({data: setOrder});
};

const matchPriceOrders = async () => {
    await Trade.matchPriceOrders();
};

const matchIndicatorOrders = async () => {
    await Trade.matchIndicatorOrders();
};

const deleteOrder = async (req, res) => {
    const { id } = req.body;
    const deleteOrder = await Trade.deleteOrder(id);
    res.status(200).json({data: deleteOrder});
};

module.exports = {
    setOrder,
    matchPriceOrders,
    matchIndicatorOrders,
    deleteOrder
};