import {getElement, createList, createListWithLink, createForm,} from "./utils.js";
let id = 1;
async function getWatchlist() {
    try {
        const data = {
            id: id
        }
        const res = await fetch(`/api/1.0/user/getWatchlist`,{
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const resJson = (await res.json()).data;
        
        resJson.map(i => createList("#watchlist_ul", i.symbol, Object.values(i)));
    } catch (err) {
        console.log("watchlist fetch failed, err");
    }
}
async function getOrders() {
    try {
        const data = {
            id: id
        }
        const res = await fetch(`/api/1.0/user/getOrders`,{
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const resJson = (await res.json()).data;
        const portfolio = resJson.portfolio;
        const history = resJson.history;
        const orders = resJson.orders;
        portfolio.map(i => createList("#portfolio_ul", i.symbol, Object.values(i)));
        history.map(i => createList("#history_ul", i.id, Object.values(i)));
        orders.map(i => createList("#orders_ul", i.id, Object.values(i)));
    } catch (err) {
        console.log("watchlist fetch failed, err");
    }
}
getWatchlist();
getOrders();