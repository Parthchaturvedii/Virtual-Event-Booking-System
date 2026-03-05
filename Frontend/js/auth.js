document.getElementById("loginForm")?.addEventListener("submit",function(e){

e.preventDefault()

alert("Login Successful")

window.location.href="index.html"

})


document.getElementById("registerForm")?.addEventListener("submit",function(e){

e.preventDefault()

alert("Account Created")

window.location.href="login.html"

})