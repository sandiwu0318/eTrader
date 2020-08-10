const User = require("../models/user_model");

const signUp = async (req, res) => {
    const { name, email, password } = req.body;
    const signUpResult = await User.signUp(name, email, password);
    if (signUpResult.error === "Email Already Exists") {
        res.status(400).json({data: {
            error: "Email Already Exists"
        }});
    } else {
        res.status(200).json({data: signUpResult});
    }
};

const signIn = async (req, res) => {
    const { email, password } = req.body;
    const signInResult = await User.signIn(email, password);
    if (signInResult.error === "Password is wrong") {
        res.status(400).json({data: {
            error: "Password is wrong"
        }});
    } else if (signInResult.error === "Please sign up first") {
        res.status(400).json({data: {
            error: "Please sign up first"
        }});
    } else {
        res.status(200).json({data: signInResult});
    }
};

const addToWatchlist = async (req, res) => {
    const { symbol } = req.body;
    const token = req.get("Authorization");
    const watchlistResult = await User.addToWatchlist(token, symbol);
    if (watchlistResult.error === "Wrong authentication") {
        res.status(400).json({data: {
            error: "Wrong authentication"
        }});
    } else {
        res.status(200).json({data: watchlistResult});
    }
};

const removeFromWatchlist = async (req, res) => {
    const { symbol } = req.body;
    const token = req.get("Authorization");
    const watchlistResult = await User.removeFromWatchlist(token, symbol);
    if (watchlistResult.error === "Wrong authentication") {
        res.status(400).json({data: {
            error: "Wrong authentication"
        }});
    } else {
        res.status(200).json({data: watchlistResult});
    }
};

const getWatchlist = async (req, res) => {
    const { symbolOnly } = req.body;
    const token = req.get("Authorization");
    const watchlistResult = await User.getWatchlist(token, symbolOnly);
    if (watchlistResult.error === "Wrong authentication") {
        res.status(400).json({data: {
            error: "Wrong authentication"
        }});
    } else {
        res.status(200).json({data: watchlistResult});
    }
};

const getOrders = async (req, res) => {
    const token = req.get("Authorization");
    const ordersResult = await User.getOrders(token);
    if (ordersResult.error === "Wrong authentication") {
        res.status(400).json({data: {
            error: "Wrong authentication"
        }});
    } else {
        res.status(200).json({data: ordersResult});
    }
};

const getPortfolios = async (req, res) => {
    const token = req.get("Authorization");
    const portfoliosResult = await User.getPortfolios(token);
    if (portfoliosResult.error === "Wrong authentication") {
        res.status(400).json({data: {
            error: "Wrong authentication"
        }});
    } else {
        res.status(200).json({data: portfoliosResult});
    }
};

module.exports = {
    signUp,
    signIn,
    addToWatchlist,
    removeFromWatchlist,
    getWatchlist,
    getOrders,
    getPortfolios
};