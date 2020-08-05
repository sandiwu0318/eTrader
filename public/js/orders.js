import {createList, checkLogin, getSymbols, searchSymbol, hoverNav, getElement} from "./utils.js";
window.scrollTo(0, 0);
const token = localStorage.getItem("token");
checkLogin(token);
if (token !== null) {
    getOrders();
}
async function getOrders() {
    try {
        const res = await fetch(`/api/1.0/user/getOrders`,{
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Authorization": `${token}`,
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
        } else if (resJson.error === "You haven't created any orders yet") {
            Swal.fire({
                text: "You haven't created any orders yet",
                icon: 'warning',
                confirmButtonText: 'Ok'
            })
            const reminder = document.createElement("div");
            reminder.className = "reminder";
            reminder.innerText = "You can place orders with prices or indicators."
            getElement("#orders_ul").appendChild(reminder);
        } else if (resJson.error) {
            Swal.fire({
                title: "Error",
                text: "Internal server error",
                icon: 'error',
                confirmButtonText: 'Ok'
            })
        } else {
            const orders = resJson.orders;
            if (orders.length !== 0) {
                let newOrders = []
                orders.forEach(i => {
                    const indicator = i.indicator;
                    let data = {
                        symbol: i.symbol,
                        action: i.sub_action,
                        volume: i.volume,
                        indicator: indicator,
                        value: 0,
                        indicatorPeriod: i.indicatorPeriod || "-",
                        cross: i.cross || "-",
                        deadline: i.deadline
                    }
                    if (indicator.substr(1 ,2) === "MA") {
                        data.value = i["MA"];
                        data.indicatorPeriod = "-";
                    } else {
                        data.value = i[indicator];
                    }
                    newOrders.push(data);
                });
                newOrders.map(i => {
                    const arr = Object.values(i)
                    arr.push("\u2716");
                    createList("#orders_ul", "user_li",arr);
                })
                const user_li = document.getElementsByClassName("user_li");
                const icons = document.getElementsByClassName("icon");
                for (let i=0; i<icons.length; i++) {
                    icons[i].addEventListener("click", async function() {
                        const result = await Swal.fire({
                            title: 'Delete it?',
                            text: "You won't be able to revert this!",
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#3fa089',
                            cancelButtonColor: 'rgb(105, 105, 105)',
                            confirmButtonText: 'Yes, delete it!'
                        })
                        if (result.value) {
                            const deleteData = {
                                id: orders[i].id
                            }
                            const res = await fetch(`/api/1.0/trade/deleteOrder`,{
                                method: "DELETE",
                                body: JSON.stringify(deleteData),
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            });
                            const resJson1 = (await res.json()).data;
                            if (resJson1.error) {
                                Swal.fire({
                                    title: "Error",
                                    text: "Internal server error",
                                    icon: 'error',
                                    confirmButtonText: 'Ok'
                                })
                            }
                            if (resJson1.message) {
                                Swal.fire({
                                    title: 'Deleted!',
                                    text: 'The order had been deleted.',
                                    icon: 'success',
                                    showConfirmButton: false,
                                })
                            }
                            user_li[i].style.display="none";
                        }
                    })
                }
            } else {
                Swal.fire({
                    text: "You don't have any orders yet",
                    icon: "warning",
                    confirmButtonText: "Ok"
                })
                const reminder = document.createElement("div");
                reminder.className = "reminder";
                reminder.innerText = "You can place orders with prices or indicators."
                getElement("#orders_ul").appendChild(reminder);
            }
        }
    } catch (err) {
        Swal.fire({
            title: "Error!",
            text: "Internal server error",
            icon: "error",
            confirmButtonText: "Ok"
        });
    }
}


let symbols;
async function getSymbolList() {
    symbols = await getSymbols();
}

getSymbolList();
searchSymbol();
hoverNav();