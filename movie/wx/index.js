'use strict'
var path = require('path') ; 
var wechat = require('../wechat/g') ; 
var util = require('../libs/util') ; 
var Wechat = require('../wechat/wechat') ;
var wechat_file = path.join(__dirname , '../config/wechat.txt') ; 
var wechat_ticket_file = path.join(__dirname , '../config/wechat_ticket.txt') ; 
var config = {
    wechat:{
        appID:"wx2530f2e4934690fd",
        appSecret:"b16c16ce29ee14f1c6c201b82277c5ed",
        token:"xiaoguoceshi",
		getAccessToken: function() {
			return util.readFileAsync(wechat_file , 'utf-8') ; 
		} , 
		saveAccessToken : function(data) {
			data = JSON.stringify(data) ; 
			return util.writeFileAsync(wechat_file , data) ; 
		} ,
		getTicket: function() {
			return util.readFileAsync(wechat_ticket_file , 'utf-8') ; 
		} , 
		saveTicket : function(data) {
			data = JSON.stringify(data) ; 
			return util.writeFileAsync(wechat_ticket_file , data) ; 
		} 
	} 
} 
exports.getConfig = config ; 
exports.getWechat = function() {
	var wechatApi = new Wechat(config) ; 
	return wechatApi ; 
}

