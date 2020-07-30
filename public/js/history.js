import {createList, checkLogin, getSymbols, searchSymbol, hoverBacktest, getElement} from "./utils.js";
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
            Swal.fire({
                text: resJson.error,
                icon: 'warning',
                confirmButtonText: 'Ok'
            })
            const reminder = document.createElement("div");
            reminder.className = "reminder";
            reminder.innerHTML = "You can place orders with prices or indicators.<br>Already placed orders? When the deal is done, it will be shown here."
            getElement("#history_ul").appendChild(reminder);
        } else {
            const history = resJson.history;
            if (history.length !== 0) {
                let newHistory = []
                history.forEach(i => {
                    let data = {
                        symbol: i.symbol,
                        action: i.sub_action,
                        indicator: i.category,
                        volume: i.volume,
                        price: i.price,
                        date: i.success_date.substr(0, 10),
                        money: i.investmentReturn
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
                const reminder = document.createElement("div");
                reminder.className = "reminder";
                reminder.innerHTML = "You can place orders with prices or indicators.<br>Already placed orders? When the deal is done, it will be shown here."
                getElement("#history_ul").appendChild(reminder);
            }
        }
    // } catch (err) {
    //     console.log("History fetch failed, err");
    // }
}

let symbols;
async function SymbolList() {
    symbols = await getSymbols();
}

SymbolList();
searchSymbol();
hoverBacktest(token);