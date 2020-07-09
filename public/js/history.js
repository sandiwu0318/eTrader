import {getElement, createList, createListWithLink, createForm,} from "./utils.js";
let id = 1;
async function getHistory() {
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
        const history = resJson.history;
        history.forEach(i => i.expense = i.volume * i.price);
        history.map(i => createList("#history_ul", "user_li",Object.values(i)));
    } catch (err) {
        console.log("History fetch failed, err");
    }
}
getHistory();