import {createList, checkLogin} from "./utils.js";
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
            alert(resJson.error);
        } else {
            const orders = resJson.orders;
            if (orders.length !== 0) {
                orders.forEach(i => i.expense = i.volume * i.price);
                orders.map(i => createList("#orders_ul", "user_li",Object.values(i)));
            } else {
                alert("You don't have any orders yet")
            }
        }
    } catch (err) {
        console.log("Orders fetch failed, err");
    }
}