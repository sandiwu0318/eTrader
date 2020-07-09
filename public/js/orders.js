import {createList, checkLogin} from "./utils.js";
const id = localStorage.getItem("id");
checkLogin(id);
if (id !== null) {
    getOrders();
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
        if (resJson.error) {
            alert(resJson.error);
        } else {
            const orders = resJson.orders;
            orders.forEach(i => i.expense = i.volume * i.price);
            orders.map(i => createList("#orders_ul", "user_li",Object.values(i)));
        }
    } catch (err) {
        console.log("Orders fetch failed, err");
    }
}