const Sequelize= require('sequelize');
var seq = require('./config.js').meiguangSeq;

var account = seq.define('account', {
    id: {
        autoIncrement:true,
        type: Sequelize.INTEGER,
        allowNull:false,
        primaryKey: true,
        comment: "编码 自增值且是主键"
    },
    name:{
        type: Sequelize.STRING,
        allowNull: false
    },
    password:{
        type: Sequelize.INTEGER,
        allowNull:true
    },
    time:{
        type: Sequelize.INTEGER,
        allowNull:true
    },
    equipmentId:{
        type: Sequelize.STRING,
        allowNull:true
    },
    remainderDays:{
        type: Sequelize.INTEGER,
        allowNull:true
    }
}, {
    freezeTableName: true, // Model 对应的表名将与model名相同,
    timestamps: false
});

module.exports = account;