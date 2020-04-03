const Sequelize = require('sequelize');
const meiguangSeq = new Sequelize('meiguang','root','',{
        host: 'localhost',
        port: 3306,
        dialect:'mysql',
        timezone: '+08:00',
    })
const paystatisSeq = new Sequelize('pay_sansantao','root','',{
        host: 'localhost',
        port: 3306,
        dialect:'mysql',
        timezone: '+08:00',
    })

module.exports = {
    meiguangSeq,
    paystatisSeq
};