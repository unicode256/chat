var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var port = process.env.PORT || 3000;
//var io = require('socket.io')(server);
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
    httpOnly: false,
    //maxAge: 60*60*1000,
    expires: 60*60*1000
  },
  resave: false,
  saveUninitialized: false, 
}))

app.use((req, res, next) => {
  if (req.cookies.user_sid && !req.session.user) {
      res.clearCookie('user_sid');        
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
    obj = JSON.stringify({username: req.session.user.username, userEmail: req.session.user.email});

    res.json(obj);
    //console.log(obj);
  }
  if(req.body.DLGDT) {
    Dialog.findAll({
      where: {
        //send: req.session.user.id
        [Op.or]: [{send: req.session.user.id}, {recieve: req.session.user.id}]
      }
    }).then(function (dialog) {
      var dialogData = [];
      for(let i = 0; i < dialog.length; i++){
        console.log(dialog[i].dataValues);
        Message.findAll({
          limit: 1,
          where: {
            did: dialog[i].dataValues.id
          },
          order: [['createdAt', 'DESC']]
        }).then(function(result){
          if(dialog[i].dataValues.send === req.session.user.id){
            User.findOne({where: {id: dialog[i].dataValues.recieve}}).then(function(user){
              dialogData[i] = {
                did: dialog[i].dataValues.id,
                username: user.dataValues.username,
                sender_id: dialog[i].dataValues.send,
                recieve_id: dialog[i].dataValues.recieve,
                message: result[0].dataValues.text,
                time: result[0].dataValues.createdAt
              }
              console.log('loop length 1: ', i);
              if(i === dialog.length-1){
                console.log('dialog data: ', dialogData);
                res.send(dialogData);
              }
            });
          }
          else if(dialog[i].dataValues.recieve === req.session.user.id){
            User.findOne({where: {id: dialog[i].dataValues.send}}).then(function(user){
              dialogData[i] = {
                did: dialog[i].dataValues.id,
                username: user.dataValues.username,
                sender_id: dialog[i].dataValues.send,
                recieve_id: dialog[i].dataValues.recieve,
                message: result[0].dataValues.text,
                time: result[0].dataValues.createdAt
              }
              console.log('loop length 2: ', i);

              if(i === dialog.length-1){
                console.log('dialog data: ', dialogData);
                res.send(dialogData);
              }
            });
          }
        });
      }
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
        obj = JSON.stringify({redirect: 'profile', status: 1});
      }
      response.json(obj);
  });

  } 
});

io.on('connection', (socket) => {
  console.log(logData.user_sid);
  socket.emit(logData.user_sid, logData);
})

server.listen(port, () => {
    console.log('Server listening at port %d', port);
  });

app.use(express.static(path.join(__dirname, 'public')));