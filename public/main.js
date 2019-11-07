$(function () {

var $window = $(window);
var $emailPage = $('.email.page');
var $passwordPage = $('.password.page');
var $emailInput = $('.emailInput');
var $passwordInput = $('.passwordInput');
var $currentInput = $emailInput.focus();

var currentPage = 'emailPage';
var email;
var password;
var logData;

const cleanInput = (input) => {
    return $('<div/>').text(input).html();
}

const setEmail = () => {
    if(email) {
        $emailPage.fadeOut(0);
        $passwordPage.show();
        $emailPage.off('click');
        $('#login').text((jQuery.parseJSON(email)).userEmail);
        currentPage = 'passwordPage';
        $currentInput = $passwordInput;
    }
}

const go = (url) => {//функция переадресации
    window.location.href = '/' + url;
}

$window.keydown(event => {
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
        $currentInput.focus();
    }
    if(event.which === 13){
        event.preventDefault();
        if(currentPage == 'emailPage'){
            email = JSON.stringify({userEmail: cleanInput($emailInput.val().trim())});
            $.ajax({//отправляем емаил в формате джэйсон на сервер
                url: '/',
                type: 'POST',
                data: email,
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                cache: false,
                success: function(result){
                    obj = jQuery.parseJSON(result);
                    console.log(obj);
                    if(obj.status === 0){
                        alert(obj.message);
                        email = '';
                    }
                    else if(obj.status === 1){
                        setEmail();
                    }
                }
            });
        }
        if(currentPage == 'passwordPage'){
            password = cleanInput($passwordInput.val().trim());
            console.log(password);
            console.log(jQuery.parseJSON(email).userEmail);
            logData = JSON.stringify({email: jQuery.parseJSON(email).userEmail, password: password});
            $.ajax({//отправляем пароль в формате джэйсон на сервер
                url: '/',
                type: 'POST',
                data: logData,
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                cache: false,
                success: function(result){
                    obj = jQuery.parseJSON(result);
                    console.log(obj);
                    if(obj.status === 0){
                        alert(obj.message);
                        password = '';
                    }
                    else if(obj.status === 1){
                        if(obj.redirect){
                            go(obj.redirect);
                        }
                    }
                }
            });
        }
    }
})
});