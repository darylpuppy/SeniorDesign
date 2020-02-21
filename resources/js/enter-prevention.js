$( document ).ready(function(){
	if (sessionStorage.getItem("email") == undefined){
        window.location.href = "login.html";
	}
})