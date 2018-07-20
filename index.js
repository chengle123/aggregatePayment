const qr = require('qr-image');
const fs = require('fs');
const cron = require('node-cron');
const mysql = require('mysql');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const querystring = require('querystring');
const AlipayService = require('./alipay');
const account = require('./models/account');
const email = require('./email');
const { alipayConfig, emailConfig, alipay_public_key } = require('./config');


// 启动服务
let app = express();
app.use(bodyParser.json({limit:'50mb'}));
app.use(bodyParser.urlencoded({ limit:'50mb', extended: false }));
app.use(express.static(path.join(__dirname, './app')));
let server = app.listen(8788, function() {
	console.log('Ready');
});

// 接口开始

// 支付成功回调
router.post('/alipayGateway', function(req, res) {
    // var data = JSON.parse(req.body.data);
    // var url = req.body.url;
    console.log(req.body)
    try{
        //文档https://docs.open.alipay.com/194/103296/
        if(signVerify(req.body)){
            email(emailConfig, {
                title: '购买通知',
                contentTitle: '购买成功',
                contentText: `您已经成功购买${req.body.subject}，感谢您的使用`,
                // to: buyerDate.email
            });
            res.end('success');
        }else{
            res.end('error');
        }
	}catch(e) {
        res.end('error');
	}
})

function signVerify(response){
    let ret = copyObj(response);
    let sign = ret['sign'];
    let sign_type = ret['sign_type'];
    ret.sign = undefined;
    ret.sign_type = undefined;
    let tmp =querystring.stringify(getSignContent(ret));
    if(sign_type === 'RSA2') {
        return crypto.createVerify('RSA-SHA256').update(tmp).verify(alipay_public_key, sign, 'base64');
    } else {
        return crypto.createVerify('RSA-SHA1').update(tmp).verify(alipay_public_key, sign, 'base64');
    }
    
}
// 排序
function getSignContent(dict){
    var dict2 = {}, 
        keys = Object.keys(dict).sort();
    for (var i = 0, n = keys.length, key; i < n; ++i) {
        key = keys[i];
        dict2[key] = dict[key];
    }
    return dict2;
}
function copyObj(obj) {
  let res = {}
  for (var key in obj) {
    res[key] = obj[key]
  }
  return res
}

// 创建订单
router.post('/getQR', function(req, res) {
    let category = req.body.category.value;
    let payMode = req.body.payMode;
    try{
        if(category === 'meiguang'){
            account.find({where:{name: req.body.email}}).then(function(rows){
                if(rows){
                    if(payMode === 'alipay'){
                        alipayQR(req.body, res);
                    }
                }else{
                    res.json({
                        result: 'error',
                        data: '',
                        msg: '账户不存在'
                    })
                }
            })
        }else{
            if(payMode === 'alipay'){
                alipayQR(req.body, res);
            }
        }
	}catch(e) {
        res.json({
            result: 'error',
            data: '',
            msg: '订单创建失败,E002'
        })
	}
})

app.use('/', router);

// 获取支付宝交易二维码
function alipayQR(ops, res){
    let alipay = new AlipayService(Object.assign({
        payAmount: (ops.good.value * ops.num).toFixed(2),
        orderName: ops.category.name + ops.good.name,
        body: `${ops.email},${ops.category.name},${ops.good.name},${ops.num},${ops.good.value}`
    }, alipayConfig));
    alipay.doPay((error, response, body)=>{
        let data = JSON.parse(body);
        if(data['code'] && data['code']=='10000'){
            let qr_png = qr.image(url, { type: 'png', margin: 0, size: 8});
            let dateName = data['out_trade_no'];
            let imgName = `./qrImages/${dateName}.png`;
            let qr_pipe = qr_png.pipe(fs.createWriteStream(imgName));
            qr_pipe.on('error', function(err){
                console.log(err);
                return;
            })
            qr_pipe.on('finish', function(){
                res.json({
                    result: 'success',
                    data: {
                        url: 'http://transaction.sansantao.com/qrImages/'+dateName+'.png'
                    },
                    msg: '订单创建成功'
                })
                console.log('http://transaction.sansantao.com/qrImages/'+dateName+'.png')
            })
        }else{
            res.json({
                result: 'error',
                data: error,
                msg: '订单创建失败,E001'
            })
            console.log(error);
            console.log(response);
            console.log(body)
        }
    })
}

// 定时更新任务
cron.schedule('1 0 0 * * *', function() {
    let dirList = fs.readdirSync('./qrImages');
     dirList.forEach(function(fileName)
     {
         fs.unlinkSync('./qrImages/' + fileName);
        //  console.log(`删除${fileName}`)
     });
});

