var Sequelize = require('sequelize');
var sequelize = new Sequelize('postgres://postgres:12042001@localhost:5432/NEW_CHAT');

var Message = sequelize.define('Messages', {
    did: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    sender: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    text: {
        type: Sequelize.TEXT,
        allowNull: false
    }
});

sequelize.sync()
    .then(() => console.log('users table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

module.exports = Message;