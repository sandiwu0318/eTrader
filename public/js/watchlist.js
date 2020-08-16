import {createList, checkLogin, removeChild, getSymbols, searchSymbol, getElement, hoverNav} from "./utils.js";
window.scrollTo(0, 0);
const socket = io();
socket.on("watchlist", async (data) => {
    if (data.error === "Wrong authentication") {
        Swal.close();
        await Swal.fire({
            title: "Please login again",
            icon: "error",
            confirmButtonText: "Ok",
            timer: "1000"
        });
        localStorage.setItem("page", window.location.href);
        window.location = "/login.html";
    } else if (data.error === "You don't have any watchlist yet") {
        Swal.close();
        Swal.fire({
            text: "You don't have any watchlist yet",
            icon: 'warning',
            confirmButtonText: 'Ok'
        })
        const reminder = document.createElement("div");
        reminder.className = "reminder";
        reminder.innerText = "You can search for stocks you like in the search bar and add to your watchlist."
        getElement("#watchlist_ul").appendChild(reminder);
        socket.disconnect();
    } else if (data.error) {
        Swal.fire({
            title: "Error",
            text: "Internal server error",
            icon: 'error',
            confirmButtonText: 'Ok'
        })
        socket.disconnect();
    }  else if (data === "disconnect") {
        socket.disconnect();
    } else {
        removeChild("watchlist_ul_content");
        Swal.close();
        data.map(i => createList("#watchlist_ul_content", "user_li", Object.values(i)));
    }
});

const token = localStorage.getItem("token");
checkLogin(token);
if (token !== null) {
    getWatchlist();
    Swal.fire({
        title: "Loading",
        allowOutsideClick: false,
        onBeforeOpen: () => {
            Swal.showLoading()
        },
    });
}

async function getWatchlist() {
    try {
        socket.emit("token", token);
    } catch (err) {
        Swal.fire({
            title: "Error!",
            text: "Internal server error",
            icon: "error",
            confirmButtonText: "Ok"
        });
    }
}

window.onbeforeunload = function() {
    socket.disconnect();
}


let symbols;
async function SymbolList() {
    symbols = await getSymbols();
}

SymbolList();
searchSymbol();
hoverNav();