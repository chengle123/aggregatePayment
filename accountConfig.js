const Sequelize = require('sequelize');
const seq = new Sequelize('meiguang','root','',{
        host: 'localhost',
        port: 3306,
        dialect:'mysql',
        timezone: '+08:00',
    })

module.exports.seq = seq;