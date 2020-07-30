import {createList, checkLogin, getSymbols, searchSymbol, hoverBacktest, getElement, removeChild} from "./utils.js";
window.scrollTo(0, 0);
const token = localStorage.getItem("token");
checkLogin(token);
if (token !== null) {
    getHistory();
}


let newHistory = []
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
                const total = newHistory.reduce((a, b) => a + b.money, 0);
                const initial = 1000000000;
                const current = initial + total;
                const change = ((current/initial -1)*100).toFixed(2);
                function toThousands(num) {
                    var num = (num || 0).toString(), result = "";
                    while (num.length > 3) {
                    result = "," + num.slice(-3) + result;
                    num = num.slice(0, num.length - 3);
                    }
                    if (num) { result = num + result; }
                    return result;
                }
                getElement("#total_asset").innerText = `Initial Asset: $ ${toThousands(initial)}`;
                getElement("#current_asset").innerText = `Total Asset: $ ${toThousands(current)} (${change}%)`;
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

const sort_input = getElement("#sort_input");
sort_input.addEventListener("change", () => {
    const label = sort_input.value;
    const user_li = document.getElementsByClassName("user_li");
    let i = 0;
    while (user_li.length > 0) {
        user_li[0].remove();
    }
    newHistory.sort(function(a, b) {
        var nameA = a[label].toUpperCase();
        var nameB = b[label].toUpperCase();
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }
        return 0;
    });
    newHistory.map(i => createList("#history_ul", "user_li", Object.values(i)));
})

let symbols;
async function SymbolList() {
    symbols = await getSymbols();
}

SymbolList();
searchSymbol();
hoverBacktest();