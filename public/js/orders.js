import {createList, checkLogin, getSymbols, searchSymbol} from "./utils.js";
window.scrollTo(0, 0);
const token = localStorage.getItem("token");
checkLogin(token);
if (token !== null) {
    getOrders();
}
async function getOrders() {
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
            Swal.fire({
                text: resJson.error,
                icon: 'warning',
                confirmButtonText: 'Ok'
            })
        } else {
            const orders = resJson.orders;
            if (orders.length !== 0) {
                let newOrders = []
                orders.forEach(i => {
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
                        deadline: i.deadline
                    }
                    newOrders.push(data);
                });
                console.log(data)
                newOrders.map(i => createList("#orders_ul", "user_li",Object.values(i)));
            } else {
                Swal.fire({
                    text: "You don't have any orders yet",
                    icon: "warning",
                    confirmButtonText: "Ok"
                })
            }
        }
    } catch (err) {
        console.log("Orders fetch failed, err");
    }
}


getSymbols();
searchSymbol();