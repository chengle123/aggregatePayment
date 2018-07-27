const qr = require('qr-image');
const fs = require('fs');
const cron = require('node-cron');
const mysql = require('mysql');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
let app = express();
let server = require('http').createServer(app);
let io = require('socket.io')(server);

const querystring = require('querystring');
const AlipayService = require('./alipay');
// const account = require('./models/account');
const email = require('./email');
const { alipayConfig, emailConfig, alipay_public_key } = require('./config');


// 启动服务
io.on('connection', function(socket){
    // socket.on("disconnect", function() {
    //     console.log("a user go out");
    // });

    socket.on("message", function(obj) {
        //延迟3s返回信息给客户端
        setTimeout(function(){
            console.log('the websokcet message is'+obj);
            io.emit("message", obj);
        },3000);
    });
});
app.use((req,res,next)=>{
  req.headers['content-type'] && (req.headers['content-type'] = req.headers['content-type'].replace('utf8','utf-8'));
  next();
});
app.use(bodyParser.urlencoded({ limit:'50mb', extended: false }));
app.use(bodyParser.json({limit:'50mb'}));
app.use(express.static(path.join(__dirname, './app')));
server.listen(8788, function() {
	console.log('Ready');
});


// 接口开始

// 支付成功回调
router.post('/alipayGateway', function(req, res) {
    var data = req.body.body.split(',');
    try{
        //文档https://docs.open.alipay.com/194/103296/
        if(signVerify(req.body)){
            console.log(123)
            console.log(data)
            email(emailConfig, {
                title: '购买通知',
                contentTitle: '购买成功',
                contentText: `您已经成功购买${req.body.subject}，感谢您的使用`,
                to: data[0]
            });
            res.end('success');
            io.emit("alipayGateway", {
                result: 'success',
                data: [],
                msg: '支付成功'
            });
            if(data[2].indexOf('美逛') > 0){
                var day = 0;
                if(data[2].indexOf('14') > 0){
                    day = 7
                }
                if(data[2].indexOf('60') > 0){
                    day = 30
                }
                if(data[2].indexOf('300') > 0){
                    day = 183
                }
                if(data[2].indexOf('540') > 0){
                    day = 365
                }
                if(data[2].indexOf('900') > 0){
                    day = 999
                }
                account.update({remainderDays: day },{ where: { name: data[0] } })
            }

            account.create({
                trade_no: req.body.trade_no,
                name: data[1]+'/'+data[2],
                num: data[3]+'/'+data[4],
                email: data[0],
                gmt_create: req.body.gmt_create
            }).then(rows => {
                
            });
        }else{
            console.log('错误')
            res.end('error');
        }
	}catch(e) {
        res.end('error');
	}
})

// 创建订单
router.post('/getQR', function(req, res) {
    let payMode = req.body.payMode;
    try{
        if(payMode === 'alipay'){
            alipayQR(req.body, res);
        }
	}catch(e) {
        res.json({
            result: 'error',
            data: '',
            msg: '订单创建失败,E002'
        })
	}
})

// 验证账户
router.post('/verifyAccount', function(req, res) {
    try{
        if(req.body.type === 'meiguang'){
            account.find({where:{name: req.body.email}}).then(function(rows){
                if(rows){
                    res.json({
                        result: 'success',
                        data: '',
                        msg: '美逛工具账户存在'
                    })
                }else{
                    res.json({
                        result: 'error',
                        data: '',
                        msg: '账户(邮箱)不存在，请先注册产品'
                    })
                }
            })
        }
	}catch(e) {
        res.json({
            result: 'error',
            data: '',
            msg: '邮箱账户查询失败'
        })
	}
})

app.use('/', router);

// signVerify({
//     gmt_create: '2018-07-26 21:32:31',
//   charset: 'utf8',
//   seller_email: '18734256377',
//   subject: '测试类型测试(0.1元)',
//   sign: 'VVF+LebiuV3zF44LtWilnDcsavd91L/77OEaY3mtm4jUqNnAx1nEdlYiF+B7S1vBl6oFSRHd4pyhdL/vEmSJI1cNRj4kFJARJle2jVMKYW0Xp6Q3JPxmZ0Pqw9k4t+3xG4rjPyFakqi1ItAYfmelKgbNRN4j5Yt351m+CrKrL1tO7LP3+E8uzB0Zd7c0k47Mmj6TNDNFCtL50YtePOdxlSq9akYCgKkqhEUJdatcLjAyNMnlfks3ou+jvrKYryKX0D5dKLD8DPrRzP8HBVYGYsU8mZmUjIWvuDNe7SLTJ1aFtzFxdSSXmgxiRa0qG1a74O9kwhf8FpkuxbGDAKxCbg==',
//   body: '314737853@qq.com,测试类型,测试(0.1元),1,0.1',
//   buyer_id: '2088312986798461',
//   invoice_amount: '0.10',
//   notify_id: '9da6a48f78748c2617da62ec2b6f79bjjx',
//   fund_bill_list: '[{"amount":"0.10","fundChannel":"ALIPAYACCOUNT"}]',
//   notify_type: 'trade_status_sync',
//   trade_status: 'TRADE_SUCCESS',
//   receipt_amount: '0.10',
//   app_id: '2018040402500795',
//   buyer_pay_amount: '0.10',
//   sign_type: 'RSA2',
//   seller_id: '2088702162037666',
//   gmt_payment: '2018-07-26 21:32:43',
//   notify_time: '2018-07-26 21:32:43',
//   version: '1.0',
//   out_trade_no: '2p1q0bep7jk2lk6g2',
//   total_amount: '0.10',
//   trade_no: '2018072621001004460579982898',
//   auth_app_id: '2018040402500795',
//   buyer_logon_id: '150***@163.com',
//   point_amount: '0.00' }
// )

// 验签
function signVerify(response){
    let obj = {} 
    let keys = Object.keys(response).sort() 
    let prestr = [] 
    keys.forEach(function (e) { 
        if (e != 'sign' && e != 'sign_type' && (response[e] || response[e] === 0)) { 
            prestr.push(`${e}=${response[e]}`) 
        } 
    });
    prestr = prestr.join('&');
    if(response['sign_type'] === 'RSA2') {
        return crypto.createVerify('RSA-SHA256').update(prestr).verify(alipay_public_key, response['sign'], 'base64');
    } else {
        return crypto.createVerify('RSA-SHA1').update(prestr).verify(alipay_public_key, response['sign'], 'base64');
    }
}

// 获取支付宝交易二维码
function alipayQR(ops, res){
    let alipay = new AlipayService(Object.assign({
        payAmount: (ops.good.value * ops.num).toFixed(2),
        orderName: ops.category.name + ops.good.name,
        body: `${ops.email},${ops.category.name},${ops.good.name},${ops.num},${ops.good.value}`
    }, alipayConfig));
    alipay.doPay((error, response, body)=>{
        let data = JSON.parse(body).alipay_trade_precreate_response;
        console.log(data)
        if(data['code'] && data['code']=='10000'){
            let qr_png = qr.image(data.qr_code, { type: 'png', margin: 0, size: 8});
            let dateName = data['out_trade_no'];
            let imgName = `./app/qrImages/${dateName}.png`;
            let qr_pipe = qr_png.pipe(fs.createWriteStream(imgName));
            qr_pipe.on('error', function(err){
                console.log(err);
                return;
            })
            qr_pipe.on('finish', function(){
                res.json({
                    result: 'success',
                    data: {
                        url: dateName+'.png'
                    },
                    msg: '订单创建成功'
                })
                // console.log(dateName+'.png')
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
    let dirList = fs.readdirSync('./app/qrImages');
     dirList.forEach(function(fileName)
     {
         fs.unlinkSync('./app/qrImages/' + fileName);
        //  console.log(`删除${fileName}`)
     });
});

