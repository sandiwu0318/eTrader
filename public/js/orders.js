import {getElement, createList, createListWithLink, createForm,} from "./utils.js";
let id = 1;
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
        const orders = resJson.orders;
        console.log(orders)
        orders.forEach(i => i.expense = i.volume * i.price);
        orders.map(i => createList("#orders_ul", "user_li",Object.values(i)));
    } catch (err) {
        console.log("Orders fetch failed, err");
    }
}
getOrders();