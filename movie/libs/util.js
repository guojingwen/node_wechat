/**
 * Created by admin on 2016/10/3.
 */
var fs = require('fs');
var Promise = require('bluebird');
var xml2js = require('xml2js');
var tpl = require('../wechat/tpl');
var ejs = require('ejs');
var crypto = require('crypto');
var heredoc = require('heredoc');
var sha1 = require('sha1');
var wx = require('../wx/index');

exports.readFileAsync = function(fpath,encoding){
    return new Promise(function(resolve,reject){
        fs.readFile(fpath,encoding,function(err,content){
            if(err)reject(err)
            else resolve(content)
        })
    })
}

exports.writeFileAsync = function(fpath,content){
    return new Promise(function(resolve,reject){
        fs.writeFile(fpath,content,function(err,content){
            if(err)reject(err)
            else resolve()
        })
    })
}

/**
 * xml转换为json对象
 * @param xml
 */
exports.parseXMLAsync = function(xml){
    return new Promise(function(resolve,reject){
        xml2js.parseString(xml,{trim:true},function(err,content){
            if(err) reject(err)
            else resolve(content)
        })
    })
}

function formatMessage(result){
    var message = {};
    if(typeof result === 'object'){
        var keys = Object.keys(result);
        for(var i = 0;i<keys.length;i++){
            var item = result[keys[i]];
            var key = keys[i];
            if(!(item instanceof Array) || item.length==0){
                continue
            }
            if(item.length ==1){
                var val = item[0];
                if(typeof val == 'object'){
                    message[key] = formatMessage(val);
                }else{
                    message[key] = (val || '').trim();
                }
            }else{
                message[key] = [];
                for(var j =0,k = item.length;j<k;j++){
                    message[key].push(formatMessage((item[j])))
                }
            }
        }
    }
    return message;
}

exports.formatMessage = formatMessage;
exports.tpl = function(content,message){
    var info = {};
    var type = 'text';
    var formUserName = message.FromUserName;
    var toUserName = message.ToUserName;
    if(Array.isArray(content)) {
        type = 'news';
    }
    type = content.type || type;
    info.content = content;
    info.createTime = new Date().getTime();
    info.msgType = type;
    info.toUserName = formUserName;
    info.fromUserName = toUserName;
    /**
     * 给ejs模板传入info参数
     */
    return tpl.compiled(info)
}


/*生成随机数*/
var createNonce = function(){
    return Math.random().toString(36).substr(2, 15);
}
/*生成当前时间戳*/
var createTimestamp = function(){
    return parseInt(new Date().getTime() / 1000, 10) + '';
}
/*签名数组加密*/
var _sign = function(noncestr, ticket, timestamp, url){
    var params = [
        'noncestr=' + noncestr,
        'jsapi_ticket=' + ticket,
        'timestamp=' + timestamp,
        'url=' + url
    ];
    var str = params.sort().join('&');
    var shasum = crypto.createHash('sha1')
    shasum.update(str);
    return shasum.digest('hex');
}
exports.sign = function(ticket,url){
    var noncestr = createNonce();
    var timestamp = createTimestamp();
    var signature = _sign(noncestr, ticket, timestamp, url);
    return {
        noncestr:noncestr,
        timestamp:timestamp,
        signature:signature
    }
}