const User = require("../models/user_model");

const signUp = async (req, res) => {
    const { name, email, password, expire } = req.body;
    const signUp = await User.signUp(name, email, password, expire);
    res.status(200).json({data: signUp});
};

const nativeSignIn = async (req, res) => {
    const { email, password, expire } = req.body;
    const nativeSignIn = await User.nativeSignIn(email, password, expire);
    res.status(200).json({data: nativeSignIn});
};

const addRemoveWatchlist = async (req, res) => {
    const { id, symbol } = req.body;
    const addRemoveWatchlist = await User.addRemoveWatchlist(id, symbol);
    res.status(200).json({data: addRemoveWatchlist});
};

const getWatchlist = async (req, res) => {
    const { id } = req.body;
    const getWatchlist = await User.getWatchlist(id);
    res.status(200).json({data: getWatchlist});
};

const getOrders = async (req, res) => {
    const { id } = req.body;
    const getOrders = await User.getOrders(id);
    res.status(200).json({data: getOrders});
};

module.exports = {
    signUp,
    nativeSignIn,
    addRemoveWatchlist,
    getWatchlist,
    getOrders
};