import {createList, checkLogin, getSymbols, searchSymbol} from "./utils.js";
window.scrollTo(0, 0);
const token = localStorage.getItem("token");
checkLogin(token);
if (token !== null) {
    getHistory();
}
async function getHistory() {
    // try {
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
            Swal.fire({
                text: resJson.error,
                icon: 'warning',
                confirmButtonText: 'Ok'
            })
        } else {
            const history = resJson.history;
            console.log(history)
            if (history.length !== 0) {
                let newHistory = []
                history.forEach(i => {
                    const indicator = i.category;
                    let data = {
                        symbol: i.symbol,
                        action: i.sub_action,
                        volume: i.volume,
                        price: i.price,
                        date: i.success_date.substr(0, 10)
                    }
                    newHistory.push(data);
                });
                newHistory.map(i => createList("#history_ul", "user_li", Object.values(i)));
            } else {
                Swal.fire({
                    text: "You don't have any history yet",
                    icon: "warning",
                    confirmButtonText: "Ok"
                })
            }
        }
    // } catch (err) {
    //     console.log("History fetch failed, err");
    // }
}

getSymbols();
searchSymbol();