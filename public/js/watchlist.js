import {createList, checkLogin, removeChild, getSymbols, searchSymbol} from "./utils.js";
window.scrollTo(0, 0);
const socket = io();
socket.on("watchlist", (data) => {
    if (data.error) {
        alert(data.error);
    } else {
        removeChild("watchlist_ul");
        data.map(i => createList("#watchlist_ul", "user_li", Object.values(i)));
    }
});

const token = localStorage.getItem("token");
checkLogin(token);
if (token !== null) {
    getWatchlist();
}

async function getWatchlist() {
    try {
        socket.emit("token", token);
    } catch (err) {
        console.log("watchlist fetch failed, err");
    }
}

window.onbeforeunload = function() {
    socket.disconnect();
}


getSymbols();
searchSymbol();