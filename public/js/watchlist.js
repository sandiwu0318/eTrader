import {createList, checkLogin, removeChild} from "./utils.js";
const id = localStorage.getItem("id");
checkLogin(id);
const socket = io();
if (id !== null) {
    getWatchlist();
}
async function getWatchlist() {
    // try {
        const data = {
            id: 1
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