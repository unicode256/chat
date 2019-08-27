$(function () {

var socket = io();
var user_id = $.cookie("user_id");
var request;
var currentPage = 'chats';
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

const cleanInput = (input) => {
    return $('<div/>').text(input).html();
}

const findDidParam = (url) => {
    var params = url.search.replace('?','').split('&').reduce(function(p,e){
        var a = e.split('=');
        p[decodeURIComponent(a[0])] = decodeURIComponent(a[1]);
        return p;
    },{});
    return params['did'];
}

const updateURL = (paramName, paramValue) => {
    if (history.pushState) {
        var baseUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        var newUrl = baseUrl + '?' + paramName + '=' + paramValue;
        history.pushState(null, null, newUrl);
    }
    else {
        console.log('History API не поддерживается');
    }
}

//контроллер чаты
const chatPage = () => {
    if(currentPage === 'users'){
        $usersPage.fadeOut();
        $('div.user_card').detach();
    }
    currentPage = 'chats';
    console.log(currentPage);
    $chatPage.fadeIn();

var $dialogCards = [];


const appendDialogs = (array, length) => {
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
        $dialogCards.push(dialogCard.clone());
    }
    $('body').on('click', '.dialog_card', function(){
        request = JSON.stringify({MSSGS: 1, did: $(this).attr('data-did'), user_id: $userName.attr('data-id'), 
        interlocutor_id: $(this).attr('data-interlocutor_id')});
        currentDialogMeta['did'] = $(this).attr('data-did');
        currentDialogMeta['interlocutor_id'] = $(this).attr('data-interlocutor_id');
        currentDialogMeta['user_id'] = $userName.attr('data-id');
        $.ajax({
            url: '/profile',
            type: 'POST',
            data: request,
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            cache: false,
            success: function(result){
                console.log(result);
                $('div.message_sended').detach();
                $('div.message_recieved').detach();

                var $message, $message_content;
                $message = $('<div></div>');
                $message_content = $('<span></span>');
                $message_content.appendTo($message);
            
                for(let i = 0; i < result.length; i++){
                    $message_content.text(result[i].text);
                    if(result[i].interlocutor_is_sender === 1){
                        $message.attr('class', 'message_recieved');
                    }
                    else{
                        $message.attr('class', 'message_sended');
                    }
                    $message.clone().appendTo($selectedDialogMessages);
                }
                $selectedDialog.fadeIn();
                console.log($('#messages'));
                console.log(document.querySelector('#messages').scrollTop);
                console.log(document.querySelector('#messages').scrollHeight);
                $('#messages')[0].scrollTop = $('#messages')[0].scrollHeight;
                selectedDialogIsOpen = true;
            }
        });
    });
}

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
    }
});

console.log('id: ', $userName.attr('data-id'));

}

$sendButton1.on('click', function(){
    console.log(currentDialogMeta);
    if(selectedDialogIsOpen ){
        if($('#message').val()){
            message = $('#message').val();
            currentDialogMeta['message'] = message;
            $('#message').val('');
            socket.emit('new message', currentDialogMeta);
        }
        else {
            alert('Вы ничего не написали');
        }
    }
    console.log(document.querySelector('#messages').scrollHeight);
});

// контроллер пользователи
const usersPage = () => {
    if(currentPage === 'chats'){
        $chatPage.fadeOut(0);
        $('div.dialog_card').detach();
    }

    var userCards = [];
    var newMessageMeta = {};


    currentPage = 'users';
    console.log(currentPage);
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
        $('body').on('click', '.write_message', function(){
            console.log($(this).closest('.user_card').attr('data-id'));
            newMessageMeta['user_id'] = $userName.attr('data-id');
            newMessageMeta['interlocutor_id'] = $(this).closest('.user_card').attr('data-id');
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
        }
    });

    $('#send_button2').on('click', function(){
        if($('#new_message').val()){
            message = $('#new_message').val();
            newMessageMeta['text'] = message;
            $('#new_message').val('');
            socket.emit('new message', newMessageMeta);

        }
        else {
            alert('Вы ничего не написали');
        }
    })
}

chatPage();//по умолчанию выводится страница с диалогами

$('.navButton').on('click', function(e){
    if(e.target.id === 'chatsButton' && currentPage !== 'chats'){
        $('#usersButton').animate({color: '#000'}, 100);
        $(e.target).animate({color: '#19b041'}, 100);
        chatPage();
    }
    if(e.target.id === 'usersButton'){
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
    $message.appendTo($selectedDialogMessages);
    $selectedDialogMessages.animate({
        scrollTop: document.querySelector('#messages').scrollHeight
    }, 1200);
});

});

