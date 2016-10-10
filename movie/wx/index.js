/**
 * Created by admin on 2016/10/6.
 */
/**
 * Created by admin on 2016/10/4.
 */
var path = require('path');
var util = require('../libs/util');
var wechat = require('../wechat/g');
var Wechat = require('../wechat/wechat');
var wechat_file = path.join(__dirname, '../config/wechat.txt');
var wechat_ticket_file = path.join(__dirname, '../config/wechat_ticket.txt');

var config = {
    wechat:{
        appID:"wxb8df959670143619",
        appSecret:"567caebdb706cdbb4aed9eb6f3b80ca7",
        token:"shensooszy",
        getAccessToken :function(){
            return util.readFileAsync(wechat_file);
        },
        saveAccessToken:function(data){
            data = JSON.stringify(data);
            return util.writeFileAsync(wechat_file,data);
        },
        getTicket :function(){
            return util.readFileAsync(wechat_ticket_file);
        },
        saveTicket:function(data){
            data = JSON.stringify(data);
            return util.writeFileAsync(wechat_ticket_file,data);
        }
    }
}

exports.getWechat = function () {
    var wechatApi = new Wechat(config.wechat);
    return wechatApi;
};
exports.config = config;