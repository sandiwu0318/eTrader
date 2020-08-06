const {getIntradayPrices} = require("../models/stock_model");
const {getWatchlist} = require("../models/user_model");

const socket = async (io) => {
    io.on("connection", (socket) => {
        const nowHours = new Date().getUTCHours();
        const nowMinutes = new Date().getUTCMinutes();
        const nowDay = new Date().getUTCDay();
        socket.on("symbol", async (symbol) => {
            socket.emit("intraday", await getIntradayPrices(symbol));
            if(socket.intraday){
                clearInterval(socket.intraday);
            }
            socket.intraday = setInterval(async () => {
                socket.emit("intraday", await getIntradayPrices(symbol));
            }, 20000);
            if ((nowHours <= 13 || nowHours >= 20) || (nowHours === 13 && nowMinutes > 1 && nowMinutes < 30) || nowDay === 6 || nowDay === 7) {
                socket.emit("intraday", "disconnect");
                clearInterval(socket.intraday);
            }
            socket.on("disconnect", () => {
                clearInterval(socket.intraday);
            });
        });
        socket.on("token", async (token) => {
            socket.emit("watchlist", await getWatchlist(token));
            if(socket.watchlist){
                clearInterval(socket.watchlist);
            }
            socket.watchlist = setInterval(async () => {
                socket.emit("intraday", await getWatchlist(token));
            }, 20000);
            if ((nowHours <= 13 || nowHours >= 20) || (nowHours === 13 && nowMinutes > 1 && nowMinutes < 30) || nowDay === 6 || nowDay === 7) {
                socket.emit("intraday", "disconnect");
                clearInterval(socket.watchlist);
            }
            socket.on("disconnect", () => {
                clearInterval(socket.watchlist);
            });
        });
    });
};

module.exports = {
    socket
};