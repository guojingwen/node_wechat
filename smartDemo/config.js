'use strict'

var path = require('path');
var util = require('./libs/util');
var wechat_file = path.join(__dirname,'./config/wechat.txt');

var config = {
    wechat: {
        appID: 'wx71a4ef0889d6ef46',
        appSecret: 'dba63edf28fb758d6ea829042bbed2f0',
        token: 'xiaoguoceshixiaoguo',
        getAccessToken() {
            return util.readFileAsync(wechat_file);
        },
        saveAccessToken(data) {
            data = JSON.stringify(data);
            return util.writeFileAsync(wechat_file, data);
        }
    }
};

module.exports = config