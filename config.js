const fs = require('fs');

const alipayConfig = {
    appId: '2018040402500795',
    notifyUrl: 'http://transaction.sansantao.com/alipayGateway',
    rsaPrivateKey: fs.readFileSync('./key/privateKey.pem'),//私钥
};

// 支付宝公钥,验签用
const alipay_public_key = fs.readFileSync('./key/alipayPublicKey.pem');

const emailConfig = {
    host: 'smtp.qq.com',
    port: 465,
    auth: {
        user: '314737853@qq.com',
        pass: ''
    }
};

module.exports = {
    alipayConfig,
    emailConfig,
    alipay_public_key
};