import {createList, checkLogin, getSymbols, searchSymbol} from "./utils.js";
window.scrollTo(0, 0);
const token = localStorage.getItem("token");
checkLogin(token);
if (token !== null) {
    getHistory();
}
async function getHistory() {
    try {
        const data = {
            token: token
        }
        const res = await fetch(`/api/1.0/user/getOrders`,{
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
            const history = resJson.history;
            if (history.length !== 0) {
                let newHistory = []
                history.forEach(i => {
                    const indicator = i.category;
                    const value = i[indicator];
                    const data = {
                        symbol: i.symbol,
                        action: i.sub_action,
                        volume: i.volume,
                        indicator: indicator,
                        value: value,
                        indicatorPeriod: i.indicatorPeriod || "-",
                        cross: i.cross || "-",
                        date: i.success_date.substr(0, 10)
                    }
                    newHistory.push(data);
                });
                newHistory.map(i => createList("#history_ul", "user_li", Object.values(i)));
            } else {
                alert("You don't have any history yet")
            }
        }
    } catch (err) {
        console.log("History fetch failed, err");
    }
}

getSymbols();
searchSymbol();