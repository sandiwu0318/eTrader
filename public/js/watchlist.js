import {createList, checkLogin, removeChild, getSymbols, searchSymbol} from "./utils.js";
window.scrollTo(0, 0);
const socket = io();
socket.on("watchlist", (data) => {
    if (data.error === "Wrong authentication") {
        swal.close();
        await Swal.fire({
            title: "Please login again",
            icon: "error",
            confirmButtonText: "Ok",
            timer: "1000"
        });
        localStorage.setItem("page", window.location.href);
        window.location = "/login.html";
    } else if (resJson.error) {
        swal.close();
        Swal.fire({
            text: resJson.error,
            icon: 'warning',
            confirmButtonText: 'Ok'
        }) 
    } else {
        removeChild("watchlist_ul");
        swal.close();
        data.map(i => createList("#watchlist_ul", "user_li", Object.values(i)));
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
        console.log("watchlist fetch failed, err");
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