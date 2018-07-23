const alipayConfig = {
    appid: '2018040402500795',
    notifyUrl: 'http://transaction.sansantao.com/alipayGateway',
    rsaPrivateKey: '123123123',//私钥
};

// 支付宝公钥,验签用
const alipay_public_key = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAk+U5BN6djeGT5tn24NsOjiYraBoeHovaF64dwYj1TswHTzfJkwm11OnY6skfqbSYEhuRRIV3Q2kRKsoCcwgqbvJe5bTtr7MXzmpm/R9mwRtx3VH6/MKafaWx5X/2FUFIFOJnyMRasqOMEs11wBSYCkO81mlNcZraFOeimWfqopjjqI3h62e+xY4+kKrv0JcU9uSzvCs7wEhi0Dz8jw3Dyt1U619DIskUK4ueM6G20hKjKQbBldVwU76+eyn6a91aEXKq5CX2txAr8oJ7ClLZVVCA8Aoqcw9CsIlbb9KbRLVYfESHN6WE2LIrVeTrKC7SWD/GgGdgs7DpNcThuy6RiwIDAQAB'

const emailConfig = {
    host: 'smtp.qq.com',
    port: 465,
    auth: {
        user: '314737853@qq.com',
        pass: 'gqvepdxyjocbbicd'
    }
};

module.exports = {
    alipayConfig,
    emailConfig,
    alipay_public_key
};