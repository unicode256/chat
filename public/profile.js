jQuery(document).ready(function(){
    jQuery('.scrollbar-macosx').scrollbar();
});

$(function () {

var socket = io();
var user_id = $.cookie("user_id");
var request;
var currentPage = 'chats';
var $window = $(window);
var $chatPage = $('#chats');
var $usersPage = $('#users');
var $sendButton1 = $('#send_button1');
var $userName = $('#second');
var $userEmail = $('#first');
var $rightside = $('#rightside');
var $dialogsSection = $('#dialogs_section');
var $selectedDialog = $('#selected_dialog');
var $selectedDialogMessages = $('#messages');
var $usersSection = $('#users_section');
var selectedDialogIsOpen = false;
var currentDialogMeta = {};

var $dialogCards = []; //хэширование диалогов(массив объектов)

const cleanInput = (input) => {
    return $('<div/>').text(input).html();
}



$window.keydown(event => {
    if(selectedDialogIsOpen){
        if (!(event.ctrlKey || event.metaKey || event.altKey)) {
            $('#message').focus();
        }
        if(event.which === 13){
            if($('#message').val()){
                message = cleanInput($('#message').val().trim());
                if(message != ''){
                    currentDialogMeta['message'] = message;
                    $('#message').val('');
                    socket.emit('new message', currentDialogMeta);
                }
            }
        }
    }
    
});

function getMessagesForDialog(request){
    var resForReturn;
    $.ajax({
        url: '/profile',
        type: 'POST',
        data: request,
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        cache: false,
        async: false,
        success: function(result){
            console.log('res: ', result);
            resForReturn = result;
        }
    });
    return resForReturn;
}

//контроллер чаты
const chatPage = () => {
    if(currentPage === 'users'){
        $usersPage.fadeOut();
        $('div.user_card').detach();
    }
    currentPage = 'chats';
    console.log(currentPage);

    let timerID = setInterval(() => {
        var string = $('div.dialogs_preloader').text();
        string = string + '.';
        if(string.length < 12){
            $('div.dialogs_preloader').text(string);
            console.log(string);
        }
        else {
            string = string.substr(0, 9);
            console.log(string);
            $('div.dialogs_preloader').text(string);
        }
    }, 200);

    $('div.bg_dialogs_preloader').fadeIn(0);
    $('div.dialogs_preloader').fadeIn(0);
    
    $chatPage.fadeIn();

const appendDialogs = (array, length) => {
    var dialogCardObject = {};
    console.log('dialogCards: ', $dialogCards);

    var dialogCard, first, second, third, username, onlineStatus, counter, message, time;
    dialogCard = $('<div class="dialog_card"></div>');
    first = $('<div class="first"></div>');
    second = $('<div class="second"></div>');
    third = $('<div class="third"></div>');
    username = $('<span class="username"></span>');
    onlineStatus = $('<span class="online_status"></span>');
    counter = $('<span class="counter"></span>');
    message = $('<span class="message"></span>');
    time = $('<span class="time"></span>');
    for(let i = 0; i < length; i++){
        var datetime = new Date(array[i].time);
        dialogCard.attr('data-did', array[i].did);
        dialogCard.attr('data-interlocutor_id', array[i].user_id);
        username.text(array[i].username);
        message.text(array[i].message);
        time.text(datetime.getHours() + ':' + datetime.getMinutes());
        counter.text(0);
        onlineStatus.text('в сети');
        username.appendTo(first);
        onlineStatus.appendTo(first);
        counter.appendTo(second);
        message.appendTo(third);
        time.appendTo(third);
        first.appendTo(dialogCard);
        second.appendTo(dialogCard);
        third.appendTo(dialogCard);
        dialogCard.clone().appendTo($dialogsSection);
        dialogCardObject['id'] = array[i].did;
        dialogCardObject['selected'] = 0;
        dialogCardObject['dialog_card'] = dialogCard.clone();
        $dialogCards[$dialogCards.length] = dialogCardObject;
        console.log('dialogCards: ', $dialogCards);
        console.log('dialogCard: ', dialogCardObject['dialog_card']);

        // console.log('did: ', array[i].did);
        dialogCardObject = {};
    }
}

request = JSON.stringify({DLGDT: 1});
$.ajax({
    url: '/profile',
    type: 'POST',
    data: request,
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    cache: false,
    success: function(result){
        console.log('result: ', result);
        appendDialogs(result, result.length);
        arrayOfDialogCards = result;
        $('div.bg_dialogs_preloader').fadeOut(0);
        $('div.dialogs_preloader').fadeOut(0);
        clearInterval(timerID);
        // console.log('dialogCards: ', $dialogCards);
    }
});

console.log('id: ', $userName.attr('data-id'));

}

$sendButton1.on('click', function(){
    console.log(currentDialogMeta);
    if(selectedDialogIsOpen ){
        if($('#message').val()){
            message = cleanInput($('#message').val().trim());
            if(message != ''){
                currentDialogMeta['message'] = message;
                $('#message').val('');
                socket.emit('new message', currentDialogMeta);
            }
        }
    }
});

// контроллер пользователи
const usersPage = () => {
    if(currentPage === 'chats'){
        $chatPage.fadeOut(0);
        $('div.dialog_card').detach();
    }

    var userCards = [];
    var firstMessageMeta = {};


    currentPage = 'users';
    console.log(currentPage);
    let timerID = setInterval(() => {
        var string = $('div.users_preloader').text();
        string = string + '.';
        if(string.length < 12){
            $('div.users_preloader').text(string);
            console.log(string);
        }
        else {
            string = string.substr(0, 9);
            console.log(string);
            $('div.users_preloader').text(string);
        }
    }, 200);
    $('div.bg_users_preloader').fadeIn(0);
    $('div.users_preloader').fadeIn(0);

    $usersPage.fadeIn();

    const appendUsers = (array, length) => {
        var userCard, u_first, u_second, u_third, username, onlineStatus, writeMessage;
        userCard = $('<div class="user_card"></div>');
        u_first = $('<div class="u_first"></div>');
        u_second = $('<div class="u_second"></div>');
        username = $('<span class="username"></span>');
        onlineStatus = $('<span class="online_status"></span>');
        writeMessage = $('<span class="write_message">Написать сообщение</span>');
        for(let i = 0; i < length; i++){
            userCard.attr('data-id', array[i].id);
            username.text(array[i].username);
            onlineStatus.text('в сети');
            username.appendTo(u_first);
            onlineStatus.appendTo(u_first);
            writeMessage.appendTo(u_second);
            u_first.appendTo(userCard);
            u_second.appendTo(userCard);
            userCard.clone().appendTo($usersSection);
            userCards.push(userCard.clone());
        }
        $('body').on('click', '.write_message', function(){//вынести это событие
            console.log($(this).closest('.user_card').attr('data-id'));
            firstMessageMeta['user_id'] = $userName.attr('data-id');
            firstMessageMeta['interlocutor_id'] = $(this).closest('.user_card').attr('data-id');
            $('#message_popup .username').text($(this).closest('.user_card').find('.username').text());

            $('#message_popup').fadeIn(200);
            $('.bg_popup').fadeIn(200);
        });
    }

    request = JSON.stringify({USRS: 1});
    $.ajax({
        url: '/profile',
        type: 'POST',
        data: request,
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        cache: false,
        success: function(result){
            console.log('users', result);
            appendUsers(result, result.length);
            $('div.bg_users_preloader').fadeOut(0);
            $('div.users_preloader').fadeOut(0);
            clearInterval(timerID);
        }
    });

    $('#send_button2').on('click', function(){//вынести это событие
        if($('#new_message').val()){
            message = $('#new_message').val().replace(/ /g, '');
            firstMessageMeta['message'] = message;
            console.log(firstMessageMeta);
            $('#new_message').val('');
            socket.emit('new message', firstMessageMeta);
            $('.bg_popup').fadeOut(200);
            $('#message_popup').fadeOut(200);
        }
    })
}

chatPage();//по умолчанию выводится страница с диалогами

//управление контроллерами
$('.navButton').on('click', function(e){
    if(e.target.id === 'chatsButton' && currentPage !== 'chats'){
        $('#usersButton').animate({color: '#000'}, 100);
        $(e.target).animate({color: '#19b041'}, 100);
        chatPage();
    }
    if(e.target.id === 'usersButton' && currentPage !== 'users'){
        $('#chatsButton').animate({color: '#000'}, 100);
        $(e.target).animate({color: '#19b041'}, 100);
        usersPage();
    }

    console.log('e', this);

})

$('.bg_popup').on('click', function(){
    $(this).fadeOut(200);
    $('#message_popup').fadeOut(200);
})

//обработчики событий

$('body').on('click', '.dialog_card', function(){
    $selectedDialog.fadeIn(0);
    let timerID = setInterval(() => {
        var string = $('div.dialog_preloader').text();
        string = string + '.';
        if(string.length < 12){
            $('div.dialog_preloader').text(string);
            console.log(string);
        }
        else {
            string = string.substr(0, 9);
            console.log(string);
            $('div.dialog_preloader').text(string);
        }
    }, 200);

    $('div.bg_dialog_preloader').fadeIn(0);
    $('div.dialog_preloader').fadeIn(0);
    currentDialogMeta['did'] = $(this).attr('data-did');
    currentDialogMeta['interlocutor_id'] = $(this).attr('data-interlocutor_id');
    currentDialogMeta['user_id'] = $userName.attr('data-id');

    //поиск нажатого диалога в массиве диалогов
    for(let i = 0; i < $dialogCards.length; i++){
        if($dialogCards[i].id == currentDialogMeta.did){
            request = JSON.stringify({MSSGS: 1, did: $(this).attr('data-did'), user_id: $userName.attr('data-id'),
            interlocutor_id: $(this).attr('data-interlocutor_id'), flag_for_message: $dialogCards[i]['flagForMessage']});
            break;
        }
    }


    var result;
    result = getMessagesForDialog(request);

    
            console.log('ress', result);
            $('div.message_sended').detach();
            $('div.message_recieved').detach();

            var $message, $message_content;
            $message = $('<div></div>');
            $message_content = $('<span></span>');
            $message_content.appendTo($message);
        
            for(let i = result.length-1; i >= 0; i--){
                $message_content.text(result[i].text);
                if(result[i].interlocutor_is_sender === 1){
                    $message.attr('class', 'message_recieved');
                }
                else{
                    $message.attr('class', 'message_sended');
                }
                $message.clone().appendTo($selectedDialogMessages);
            }

            //поиск нажатого диалога в массиве
            for(let i = 0; i < $dialogCards.length; i++){
                if($dialogCards[i].id == currentDialogMeta.did){
                    $dialogCards[i]['flagForMessage'] = result[result.length-1].id;
                    break;
                }
            }

            // dialogCardObject['flagForMessage'] = result[result.length-1].id;
            // console.log('messages: ', jQuery('.scroll-wrapper'));
            // console.log('scrollTop: ', document.querySelector('.scroll-wrapper').scrollTop);
            // console.log('Height: ', jQuery('#messages').height());
            // console.log('dialogCards: ', $dialogCards);
            console.log('pressed dialog from hash: ', $dialogCards);

            jQuery('.scrollbar-macosx').scrollTop(jQuery('#messages').height());
            $('div.bg_dialog_preloader').fadeOut(0);
            $('div.dialog_preloader').fadeOut(0);
            clearInterval(timerID);
            selectedDialogIsOpen = true;
});

request = JSON.stringify({SSDT: 1});
$.ajax({
    url: '/profile',
    type: 'POST',
    data: request,
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    cache: false,
    success: function(result){
        obj = jQuery.parseJSON(result);
        console.log(obj);
        $userEmail.text(obj.userEmail);
        $userName.text(obj.username);
        $userName.attr('data-id', obj.userId);
        $rightside.fadeIn();
    }
});

socket.on(user_id, function(recievedCurrentDialogMeta){
    console.log(currentDialogMeta);
    var $message, $message_content;
    $message = $('<div></div>');
    $message_content = $('<span></span>');
    $message_content.appendTo($message);
    $message_content.text(recievedCurrentDialogMeta.message);
    console.log(typeof(currentDialogMeta.did));
    if(recievedCurrentDialogMeta.user_id === $userName.attr('data-id')){
        $message.attr('class', 'message_sended');
    }
    else {
        $message.attr('class', 'message_recieved');
    }
    console.log('messages: ', jQuery('.scroll-wrapper'));
    console.log('scrollTop: ', document.querySelector('.scroll-wrapper').scrollTop);
    console.log('Height: ', jQuery('#messages').height());
    $message.appendTo($selectedDialogMessages);
    jQuery('.scrollbar-macosx').scrollTop(jQuery('#messages').height());
    /*jQuery('.scrollbar-macosx').animate({
        scrollTop: jQuery('#messages').height()
    }, 1200);*/
});

});

