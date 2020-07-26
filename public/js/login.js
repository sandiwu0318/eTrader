import {getElement, getSymbols, searchSymbol} from "./utils.js";
window.scrollTo(0, 0);
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
                Swal.fire({
                    title: "Error!",
                    text: resJson.error,
                    icon: "error",
                    confirmButtonText: "Ok"
                });
            } else {
                await Swal.fire({
                    title: "Success!",
                    text: "sign up successfully",
                    icon: "success",
                    showConfirmButton: false,
                    timer: "1000"
                });
                localStorage.setItem("token", resJson.accessToken);
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
            if (resJson.error) {
                Swal.fire({
                    title: "Error!",
                    text: resJson.error,
                    icon: "error",
                    confirmButtonText: "Ok"
                })
            } else {
                await Swal.fire({
                    title: "Success!",
                    text: "sign in successfully",
                    icon: "success",
                    showConfirmButton: false,
                    timer: "1000"
                });
                localStorage.setItem("token", resJson.accessToken);
                window.location = localStorage.getItem("page");
            }
        } catch (err) {
            console.log("price fetch failed, err");
        }
    }
)

getSymbols();
searchSymbol();