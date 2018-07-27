const Sequelize= require('sequelize');
var seq = require('./config.js').paystatisSeq;

var account = seq.define('order', {
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
    num:{
        type: Sequelize.STRING,
        allowNull:true
    },
    gmt_create:{
        type: Sequelize.STRING,
        allowNull:true
    },
    email:{
        type: Sequelize.STRING,
        allowNull:true
    },
    key:{
        type: Sequelize.STRING,
        allowNull:true
    }
}, {
    freezeTableName: true, // Model 对应的表名将与model名相同,
    timestamps: false
});

module.exports = account;