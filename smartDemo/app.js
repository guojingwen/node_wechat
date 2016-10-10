'use strict'

var Koa = require('koa');
var path = require('path');
var toStatic = require('koa-static')
var route = require('koa-route');
var wechat = require('./wechat/g');
var config = require('./config');
var weixin = require('./weixin');
//var wechat_file = path.join(__dirname,'./config/wechat.txt');

var app = new Koa();

/*app.use(function* (next) {
    // TODO  这里做拦截,权限验证
    if (this.path === '/wechat') {
        wechat(config.wechat,weixin.reply);
        return next

    }
    yield next;
})*/


/*function *register(){
    this.body = 'register';
}
app.use(route.get('/register', register));*/
// app.use(route.get('/wechat', wechat(config.wechat,weixin.reply)));
// app.use(route.post('/wechat', wechat(config.wechat,weixin.reply)));

app.use(wechat(config.wechat, weixin.reply));

//app.use(toStatic(__dirname + '/static'));


app.listen(1244);
console.log("Listening: 1244 ");

// node --harmony app.js //开启服务
// ./ngrok -config ngrok.cfg -subdomain scott_wechat 1234