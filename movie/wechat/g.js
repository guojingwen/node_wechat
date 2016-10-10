/**
 * Created by admin on 2016/10/3.
 */
/**
 * Created by admin on 2016/10/3.
 */
var sha1 = require('sha1');
var Wechat = require('./wechat')
var getRawBody = require('raw-body');
var util = require('../libs/util');

module.exports = function(opts,handler){
    var wechat = new Wechat(opts);
    return function *(next){
        var that = this;
        var token = opts.token;
        var signature = this.query.signature;
        var nonce = this.query.nonce;
        var timestamp = this.query.timestamp;
        var echostr = this.query.echostr;
        var str = [token, timestamp, nonce].sort().join('');
        var sha = sha1(str);
        /**
         * 验证token
         */
        if(this.method==='GET'){
            if(sha==signature){
                this.body = echostr + '';
            }else{
                this.body = 'wrong';
            }
        }else if(this.method==='POST'){
            if(sha!==signature){
                this.body = 'wrong';
                return false;
            }
            /**
             * 将用户发送来xml信息格式化为json对象
             */
            var data = yield getRawBody(this.req, {
                length: this.length,
                limit:'1mb',
                encoding:this.charset
            });
            console.log(data)
            var content = yield util.parseXMLAsync(data);
            var message = util.formatMessage(content.xml);
            this.weixin = message;
            /**
             * 处理用户发送来的信息
             */
            yield handler.call(this, next);
            /**
             * 回复用户方法
             */
            wechat.reply.call(this);
        }
    }
}