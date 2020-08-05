const User = require("../models/user_model");

const signUp = async (req, res) => {
    const { name, email, password } = req.body;
    const signUp = await User.signUp(name, email, password);
    res.status(200).json({data: signUp});
};

const signIn = async (req, res) => {
    const { email, password } = req.body;
    const signIn = await User.signIn(email, password);
    res.status(200).json({data: signIn});
};

const addRemoveWatchlist = async (req, res) => {
    const { symbol } = req.body;
    const token = req.get("Authorization");
    const addRemoveWatchlist = await User.addRemoveWatchlist(token, symbol);
    res.status(200).json({data: addRemoveWatchlist});
};

const getWatchlist = async (req, res) => {
    const { symbolOnly } = req.body;
    const token = req.get("Authorization");
    const getWatchlist = await User.getWatchlist(token, symbolOnly);
    res.status(200).json({data: getWatchlist});
};

const getOrders = async (req, res) => {
    const token = req.get("Authorization");
    const getOrders = await User.getOrders(token);
    res.status(200).json({data: getOrders});
};

const getPortfolios = async (req, res) => {
    const token = req.get("Authorization");
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