import {getElement, getSymbols, searchSymbol} from "./utils.js";
window.scrollTo(0, 0);


async function signInUp(action) {
    const data = {
        email: getElement("#email").value,
        password: getElement("#password").value
    }
    const EmailRe = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$/;
    if (data.email.length === 0 || data.password.length === 0) {
        Swal.fire({
            title: "Error!",
            text: "Please fill out email and password",
            icon: "error",
            confirmButtonText: "Ok"
        });
    } else if (data.email.search(EmailRe) === -1) {
        Swal.fire({
            title: "Error!",
            text: "Wrong email format",
            icon: "error",
            confirmButtonText: "Ok"
        });
    } else {
        const res = await fetch(`/api/1.0/user/${action}`, {
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
                text: `${action} successfully`,
                icon: "success",
                showConfirmButton: false,
                timer: "1000"
            });
            localStorage.setItem("token", resJson.accessToken);
            window.location = localStorage.getItem("page");
        }
    }
}

const signUpBtn = getElement("#signUpBtn");
signUpBtn.addEventListener("click",
    async function (){
        try{
            signInUp("signUp")
        } catch (err) {
            console.log("signUp failed, err");
        }
    }
)

const signInBtn = getElement("#signInBtn");
signInBtn.addEventListener("click",
    async function (){
        try{
            signInUp("signIn")
        } catch (err) {
            console.log("signUp failed, err");
        }
    }
)

let symbols;
async function SymbolList() {
    symbols = await getSymbols();
}

SymbolList();
searchSymbol();