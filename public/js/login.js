import {getElement} from "./utils.js";
const signUpBtn = getElement("#signUpBtn");
signUpBtn.addEventListener("click",
    async function (){
        const data = {
            email: getElement("#email").value,
            password: getElement("#password").value
        }
        try {
            const res = await fetch(`/api/1.0/user/signUp`, {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const resJson = (await res.json()).data;
            if (resJson.error) {
                alert(resJson.error);
            } else {
                localStorage.setItem("id", resJson.user.id);
                window.location = localStorage.getItem("page");
            }
        } catch (err) {
            console.log("price fetch failed, err");
        }
    }
)

const signInBtn = getElement("#signInBtn");
signInBtn.addEventListener("click",
    async function (){
        const data = {
            email: getElement("#email").value,
            password: getElement("#password").value
        }
        try {
            const res = await fetch(`/api/1.0/user/nativeSignIn`, {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const resJson = (await res.json()).data;
            console.log(resJson)
            if (resJson.error) {
                alert(resJson.error);
            } else {
                localStorage.setItem("id", resJson.user.id);
                window.location = localStorage.getItem("page");
            }
        } catch (err) {
            console.log("price fetch failed, err");
        }
    }
)