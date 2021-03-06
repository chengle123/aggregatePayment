const querystring = require('querystring');
const crypto = require('crypto');
const uniqid = require('uniqid');
var request = require('request');

/**
 * ops={}
 * ops.appid ------https://open.alipay.com 账户中心->密钥管理->开放平台密钥，填写添加了电脑网站支付的应用的APPID
 * ops.notifyUrl -----付款成功后的异步回调地址
 * ops.payAmount -----付款金额，单位:元
 * ops.orderName -----订单标题
 * ops.signType -----签名算法类型，支持RSA2和RSA，默认使用RSA2
 * ops.rsaPrivateKey -----商户私钥，填写对应签名算法类型的私钥，如何生成密钥参考：https://docs.open.alipay.com/291/105971和https://docs.open.alipay.com/200/105310
 * ops.timeout -----订单过期时间，默认30分钟
 * 使用：实例化xx = new AlipayService(ops); xx.doPay((error, response, body)=>{})
 */
class AlipayService {
    constructor(ops) {
        this.ops = {
            timeout: '30m',
            signType: 'RSA2'
        }
        this.ops = Object.assign(this.ops, ops);
    }
    doPay(fn){
        let requestConfigs = {
            out_trade_no: uniqid(), // 订单号
            total_amount: this.ops.payAmount,  // 金额
            subject: this.ops.orderName,  // 订单标题
            timeout_express: this.ops.timeout, // 该笔订单允许的最晚付款时间，逾期将关闭交易。取值范围：1m～15d。m-分钟，h-小时，d-天，1c-当天（1c-当天的情况下，无论交易何时创建，都在0点关闭）。 该参数数值不接受小数点， 如 1.5h，可转换为 90m。
            body: this.ops.body
        };
        
        // 公共参数
        let commonConfigs = {
            app_id: this.ops.appId,
            method: 'alipay.trade.precreate',  //接口名称
            format: 'JSON',
            charset: 'utf8',
            sign_type: this.ops.signType,
            timestamp: new Date().Format('YYYY-MM-DD HH:mm:ss'),
            version: '1.0',
            notify_url:  this.ops.notifyUrl,
            biz_content: JSON.stringify(requestConfigs)
        };

        var ret = this.encodeParams(commonConfigs);
        var sign = this.sign(ret.unencode, this.ops.signType);
        this.curlPost('https://openapi.alipay.com/gateway.do',ret.encode, encodeURIComponent(sign), (error, response, body)=>{
            fn(error, response, body);
        });
    }
    encodeParams(params) {
        var keys = [];
        for(var k in params) {
            var v = params[k];
            if (params[k] !== undefined && params[k] !== "") keys.push(k);
        }
        keys.sort();

        var unencodeStr = "";
        var encodeStr = "";
        var len = keys.length;
        for(var i = 0; i < len; ++i) {
            var k = keys[i];
            if(i !== 0) {
                unencodeStr += '&';
                encodeStr += '&';
            }
            unencodeStr += k + '=' + params[k];
            encodeStr += k + '=' + encodeURIComponent(params[k]);
        }
        return {unencode:unencodeStr, encode:encodeStr};
    }
    // 签名
    sign(data, signType){
        var sha;
        if(signType === 'RSA2') {
            sha = crypto.createSign('RSA-SHA256');
        } else {
            sha = crypto.createSign('RSA-SHA1');
        }
        sha.update(data, 'utf8');
        return sha.sign(this.ops.rsaPrivateKey, 'base64');
    }
    curlPost(url, ops, sign, callback){
        request({
            url: url +'?'+ ops + '&sign=' + sign,
            method: "GET"
        }, function(error, response, body) {
            callback(error, response, body);
        });
    }
}

Date.prototype.Format = function(formatStr)
{
    var str = formatStr;
    var Week = ['日','一','二','三','四','五','六'];
    str=str.replace(/yyyy|YYYY/,this.getFullYear());
    str=str.replace(/yy|YY/,(this.getYear() % 100)>9?(this.getYear() % 100).toString():'0' + (this.getYear() % 100));
    str=str.replace(/MM/,this.getMonth()+1>9?this.getMonth()+1:'0' + (this.getMonth()+1));
    str=str.replace(/M/g,this.getMonth()+1);
    str=str.replace(/w|W/g,Week[this.getDay()]);
    str=str.replace(/dd|DD/,this.getDate()>9?this.getDate().toString():'0' + this.getDate());
    str=str.replace(/d|D/g,this.getDate());
    str=str.replace(/hh|HH/,this.getHours()>9?this.getHours().toString():'0' + this.getHours());
    str=str.replace(/h|H/g,this.getHours());
    str=str.replace(/mm/,this.getMinutes()>9?this.getMinutes().toString():'0' + this.getMinutes());
    str=str.replace(/m/g,this.getMinutes());
    str=str.replace(/ss|SS/,this.getSeconds()>9?this.getSeconds().toString():'0' + this.getSeconds());
    str=str.replace(/s|S/g,this.getSeconds());
    return str;
}

module.exports = AlipayService;