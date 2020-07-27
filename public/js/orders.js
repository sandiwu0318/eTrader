import {createList, checkLogin, getSymbols, searchSymbol} from "./utils.js";
window.scrollTo(0, 0);
const token = localStorage.getItem("token");
checkLogin(token);
if (token !== null) {
    getOrders();
}
async function getOrders() {
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
            const orders = resJson.orders;
            console.log(orders)
            if (orders.length !== 0) {
                let newOrders = []
                orders.forEach(i => {
                    const indicator = i.category;
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
                newOrders.map(i => createList("#orders_ul", "user_li",Object.values(i)));
                const user_li = document.getElementsByClassName("user_li");
                for (let i=0; i<user_li.length; i++) {
                    user_li[i].addEventListener("click", async function() {
                        await Swal.fire({
                            title: 'Delete it?',
                            text: "You won't be able to revert this!",
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#3085d6',
                            cancelButtonColor: '#d33',
                            confirmButtonText: 'Yes, delete it!'
                        })
                        const deleteData = {
                            id: orders[i].id
                        }
                        console.log(deleteData)
                        const res = await fetch(`/api/1.0/trade/deleteOrder`,{
                            method: "POST",
                            body: JSON.stringify(deleteData),
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        const resJson1 = (await res.json()).data;
                        if (resJson1.message) {
                            Swal.fire(
                                'Deleted!',
                                'The order had been deleted.',
                                'success'
                            )
                        }
                    })
                }
            } else {
                Swal.fire({
                    text: "You don't have any orders yet",
                    icon: "warning",
                    confirmButtonText: "Ok"
                })
            }
        }
    // } catch (err) {
    //     console.log("Orders fetch failed, err");
    // }
}


getSymbols();
searchSymbol();