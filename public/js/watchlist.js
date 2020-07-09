import {createList, checkLogin, loginBtn} from "./utils.js";
const id = localStorage.getItem("id");
loginBtn();
checkLogin(id);
if (id !== null) {
    getWatchlist();
}
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
        if (resJson.error) {
            alert(resJson.error);
        } else {
            resJson.map(i => createList("#watchlist_ul", "user_li", Object.values(i)));
            const pieLayout = {
                title: 'Product sold percentage in different colors',
                height: 400,
                width: 500
            };
            Plotly.newPlot('pie', pieData, pieLayout);
        }
    } catch (err) {
        console.log("watchlist fetch failed, err");
    }
}