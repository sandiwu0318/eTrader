import {getElement} from "./utils.js";
window.scrollTo(0, 0);


async function signInUp(action) {
    const data = {
        email: getElement("#email").value,
        password: getElement("#password").value
    }
    if(action === "signUp") {
        data.name = getElement("#name").value;
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
            Swal.fire({
                title: "Error!",
                text: "Internal server error",
                icon: "error",
                confirmButtonText: "Ok"
            });
        }
    }
)

const signInBtn = getElement("#signInBtn");
signInBtn.addEventListener("click",
    async function (){
        try{
            signInUp("signIn")
        } catch (err) {
            Swal.fire({
                title: "Error!",
                text: "Internal server error",
                icon: "error",
                confirmButtonText: "Ok"
            });
        }
    }
)

const signUpLink = getElement("#signUpLink");
const signUpDiv = getElement("#signUpDiv");
const signInLink = getElement("#signInLink");
const signInDiv = getElement("#signInDiv");
const signUpInput = document.getElementsByClassName("signUpInput");
signUpLink.addEventListener("click", () => {
    signInBtn.style.display = "none";
    signUpBtn.style.display = "inline-block";
    for (let i of signUpInput) {
        i.style.display = "inline-block";
    }
    signUpDiv.style.display = "none";
    signInDiv.style.display = "flex";
})

signInLink.addEventListener("click", () => {
    signInBtn.style.display = "inline-block";
    signUpBtn.style.display = "none";
    for (let i of signUpInput) {
        i.style.display = "none";
    }
    signUpDiv.style.display = "flex";
    signInDiv.style.display = "none";
})