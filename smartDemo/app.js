'use strict'

var Koa = require('koa');
var path = require('path');
var route = require('koa-route');
var wechat = require('./wechat/g');
var config = require('./config');
var weixin = require('./weixin');
//var wechat_file = path.join(__dirname,'./config/wechat.txt');

var app = new Koa();

app.use(wechat(config.wechat, weixin.reply));

app.listen(1244);
console.log("Listening: 1244 ");


//var toStatic = require('koa-static')
//app.use(toStatic(__dirname + '/static'));
// node --harmony app.js //开启服务
// ./ngrok -config ngrok.cfg -subdomain scott_wechat 1234