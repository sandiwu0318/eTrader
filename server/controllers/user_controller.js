const User = require("../models/user_model");

const signUp = async (req, res) => {
    const { name, email, password, expire } = req.body;
    const signUp = await User.signUp(name, email, password, expire);
    res.status(200).json({data: signUp});
};

const signIn = async (req, res) => {
    const { email, password, expire } = req.body;
    const signIn = await User.signIn(email, password, expire);
    res.status(200).json({data: signIn});
};

const addRemoveWatchlist = async (req, res) => {
    const { token, symbol } = req.body;
    const addRemoveWatchlist = await User.addRemoveWatchlist(token, symbol);
    res.status(200).json({data: addRemoveWatchlist});
};

const getWatchlist = async (req, res) => {
    const { token, symbolOnly } = req.body;
    const getWatchlist = await User.getWatchlist(token, symbolOnly);
    res.status(200).json({data: getWatchlist});
};

const getOrders = async (req, res) => {
    const { token } = req.body;
    const getOrders = await User.getOrders(token);
    res.status(200).json({data: getOrders});
};

const getPortfolios = async (req, res) => {
    const { token } = req.body;
    const getPortfolios = await User.getPortfolios(token);
    res.status(200).json({data: getPortfolios});
};

module.exports = {
    signUp,
    signIn,
    addRemoveWatchlist,
    getWatchlist,
    getOrders,
    getPortfolios
};