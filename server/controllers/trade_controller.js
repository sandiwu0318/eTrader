const Trade = require("../models/trade_model");


const setOrder = async (req, res) => {
    const { token, symbol, price, volume, action, period } = req.body;
    const setOrder = await Trade.setOrder(token, symbol, price, volume, action, period);
    res.status(200).json({data: setOrder});
};

const matchOrders = async () => {
    await Trade.matchOrders();
};

module.exports = {
    setOrder,
    matchOrders,
};