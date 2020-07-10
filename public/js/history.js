import {createList, checkLogin} from "./utils.js";
const id = localStorage.getItem("id");
checkLogin(id);
if (id !== null) {
    getHistory();
}
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
        if (resJson.error) {
            alert(resJson.error);
        } else {
            const history = resJson.history;
            if (history.length !== 0) {
                history.forEach(i => i.expense = i.volume * i.price);
                history.map(i => createList("#history_ul", "user_li", Object.values(i)));
            } else {
                alert("You don't have any history yet")
            }
        }
    } catch (err) {
        console.log("History fetch failed, err");
    }
}