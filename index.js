var express = require('express');
var Sequelize = require('sequelize');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var port = process.env.PORT || 3000;
var io = require('socket.io')(server);
const jsonParser = express.json();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var morgan = require('morgan');
const session = require('express-session');
const Op = Sequelize.Op;
//const file_store = require('session-file-store')(session);

var User = require('./user.js');
var Dialog = require('./dialog.js');
var Message = require('./message.js');

var logData = {};

app.use(morgan('dev'));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  key: 'user_sid',
  secret: 'secret',
  //store: new fileStore,
  cookie: {
    //path: '/', 
    httpOnly: true,
    //maxAge: 60*60*1000,
    expires: 60*60*1000
  },
  resave: false,
  saveUninitialized: false, 
}))

app.use((req, res, next) => {
  if (req.cookies.user_sid && !req.session.user) {
      res.clearCookie('user_sid');
      res.clearCookie('user_id');        
  }
  next();
});

app.use((req, res, next) => {
  if (req.cookies.user_sid && req.session.user) {
      res.cookie('user_id', req.session.user.id, {
        maxAge: 60*60*1000,
        httpOnly: false,
      }); 
    console.log('id cookie created successfully');       
  }
  else {
    console.log('cookie exists', req.cookies.user_id);
  }
  next();
});

var sessionChecker = (req, res, next) => {
  if (req.session.user && req.cookies.user_sid) {
    res.redirect('/profile');
  } 
  else {
    console.log('threre is no session');
    next();
  }    
};

app.get('/profile', (req, res) => {
  /*Message.create({
    did: 2,
    sender: 1,
    text: 'test'
  });*/
  if (req.session.user && req.cookies.user_sid) {
    logData['user_sid'] = req.cookies.user_sid;
    res.sendFile(__dirname + '/public/profile.html');
    console.log(req.session.user);
    console.log(logData.user_sid);

  } else {
    res.redirect('/');
  }
});

app.post('/profile', (req, res) => {
  if(req.body.SSDT) {
    obj = JSON.stringify({username: req.session.user.username, userEmail: req.session.user.email, userId: req.session.user.id});

    res.json(obj);
    //console.log(obj);
  }
  if(req.body.DLGDT) {
    dialogData = [];
    Dialog.findAll({
      where: {
        //send: req.session.user.id
        [Op.or]: [{send: req.session.user.id}, {recieve: req.session.user.id}]
      }
    }).then(async(dialog) => {
      var user = {};
      for(let i = 0; i < dialog.length; i++){
        const message = await Message.findAll({
          limit: 1,
          where: {
            did: dialog[i].dataValues.id
          },
          order: [['createdAt', 'DESC']]
        });
        if(dialog[i].dataValues.send === req.session.user.id){
          user = await User.findOne({where: {id: dialog[i].dataValues.recieve}});
        }
        else if(dialog[i].dataValues.recieve === req.session.user.id){
          user = await User.findOne({where: {id: dialog[i].dataValues.send}});
        }
        dialogData[i] = {
          did: dialog[i].dataValues.id,
          username: user.dataValues.username,
          user_id: user.dataValues.id,
          sender_id: dialog[i].dataValues.send,
          recieve_id: dialog[i].dataValues.recieve,
          message: message[0].dataValues.text,
          time: message[0].dataValues.createdAt
        }
      }
      console.log(dialogData);
      res.send(dialogData);
    });
  }
  if(req.body.MSSGS){
    if(req.body.flag_for_message === undefined){
      console.log('flag: ', req.body.flag_for_message);
      req.body.flag_for_message = 400;
    }
    if(req.body.flag_for_message !== undefined){
      Message.findAll({
        limit: 30,
        where: {
          did: req.body.did,
          id: {
            [Op.lt]: req.body.flag_for_message
          }
        },
        order: [
          ['id', 'DESC']
        ]
      }).then(function(messages){
        for(let i = 0; i < messages.length; i++){
          if(messages[i].sender === req.session.user.id){
            messages[i].dataValues['interlocutor_is_sender'] = 0;
          }
          else {
            messages[i].dataValues['interlocutor_is_sender'] = 1;
          }
        }
        res.send(messages);
      })
    }
  }
  if(req.body.USRS){
    User.findAll({
      where: {
        id: {
          [Op.not]: req.session.user.id
        }
      }
    }).then(function(users){
      res.send(users);
    });
  }
});

app.get('/logout', (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
      res.clearCookie('user_sid');
      res.redirect('/');
  } else {
      res.redirect('/');
  }
});

app.get('/', sessionChecker, (req, res, next) => {
  next();
})

app.post('/', sessionChecker, jsonParser, (request, response, next) => {

  if(request.body.userEmail){
    console.log('recieved email: ' + request.body.userEmail);
    User.findOne({ where: { email: request.body.userEmail } }).then(function (user) {
      if (!user) {
        obj = JSON.stringify({message: 'Email is not exist', status: 0});
      }
      else {
        obj = JSON.stringify({status: 1});
        console.log('email: ' + user.email);
      }
      response.json(obj);
    });
  }
  if(request.body.password){
    var email = request.body.email;
    var password = request.body.password;

    User.findOne({ where: { email: email } }).then(function (user) {
      if (!user) {
        obj = JSON.stringify({message: 'Email is not exist', status: 0});
      } else if (!user.validPassword(password)) {
        obj = JSON.stringify({message: 'Неверный пароль', status: 0});
      } else {
        request.session.user = user.dataValues;
        logData['username'] = request.session.user.username;
        logData['email'] = request.session.user.email;
        logData['id'] = request.session.user.id;
        obj = JSON.stringify({redirect: 'profile', status: 1});
      }
      response.json(obj);
  });

  } 
});

io.on('connection', (socket) => {
  socket.on('new message', function(currentDialogMeta){
    Dialog.findOne({
      where: {
        [Op.or]: [{send: currentDialogMeta.user_id}, {recieve: currentDialogMeta.user_id}],
        [Op.or]: [{send: currentDialogMeta.interlocutor_id}, {recieve: currentDialogMeta.interlocutor_id}],
      }
    }).then(function(dialog){
      console.log('dialog: ');
      if(dialog){
        console.log(dialog.dataValues);
      }

      if(!dialog){
        Dialog.create({
          status: 0,
          send: currentDialogMeta.user_id,
          recieve: currentDialogMeta.interlocutor_id
        }).then(function(result) {
          Message.create({
            did: result.id,
            sender: currentDialogMeta.user_id,
            text: currentDialogMeta.message
          }).then(function() {
            //io.emit(currentDialogMeta.interlocutor_id, currentDialogMeta);
            console.log('message could be recieved: ', currentDialogMeta);
            //io.emit(currentDialogMeta.user_id, currentDialogMeta);
          })
        });
      }
      else {
        if(!currentDialogMeta['did']){
          currentDialogMeta['did'] = dialog.dataValues.id;
        }
        console.log('did = ' + currentDialogMeta['did']);
        Message.create({
          did: currentDialogMeta.did,
          sender: currentDialogMeta.user_id,
          text: currentDialogMeta.message
        }).then(function() {
          Dialog.update({
            send: currentDialogMeta.user_id,
            recieve: currentDialogMeta.interlocutor_id
          },
          {
            where: {
              id: currentDialogMeta.did
            }
          }).then(function(){
            console.log('currentDialogMeta: ', currentDialogMeta);
            console.log('currentDialogMeta-did: ', currentDialogMeta.did);
            io.emit(currentDialogMeta.interlocutor_id, currentDialogMeta);
            io.emit(currentDialogMeta.user_id, currentDialogMeta);
          });
        });
      }
    });
  });
})

server.listen(port, () => {
    console.log('Server listening at port %d', port);
  });

app.use(express.static(path.join(__dirname, 'public')));