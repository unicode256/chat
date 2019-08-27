var Sequelize = require('sequelize');
var sequelize = new Sequelize('postgres://postgres:12042001@localhost:5432/NEW_CHAT');

var Dialog = sequelize.define('Dialogs', {
    status: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    send: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    recieve: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
});

sequelize.sync()
    .then(() => console.log('users table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

module.exports = Dialog;