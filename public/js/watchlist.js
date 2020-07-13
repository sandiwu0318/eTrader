import {createList, checkLogin, removeChild} from "./utils.js";
const token = localStorage.getItem("token");
checkLogin(token);
const socket = io();
if (token !== null) {
    getWatchlist();
}
async function getWatchlist() {
    // try {
        const data = {
            token: token
        }
        fetch(`/api/1.0/user/getWatchlist`,{
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        socket.on("watchlist", (data) => {
            if (data.error) {
                alert(data.error);
            } else {
                removeChild("watchlist_ul");
                data.map(i => createList("#watchlist_ul", "user_li", Object.values(i)));
            }
        });
        console.log(window.location.pathname === "/watchlist.html")
    // } catch (err) {
    //     console.log("watchlist fetch failed, err");
    // }
}
window.onbeforeunload = function() {
    socket.disconnect();
}