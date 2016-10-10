/**
 * Created by admin on 2016/10/4.
 */
var wx = require('../wx/index');
var wechatApi = wx.getWechat();
var Movie = require('../app/api/movie');

exports.reply = function* (next){
    var message = this.weixin;
    console.log(message)
    if (message.MsgType == 'event'){
        /*如果是订阅事件*/
        if(message.Event == 'subscribe'){
            console.log('扫码进来的')
            this.body = '亲爱的，欢迎关注科幻电影世界\n'+
                '回复1~3测试文字回复\n'+
                '回复4测试图文回复\n'+
                '回复 首页,进入电影首页\n'+
                '回复 登陆,进入微信登陆绑定\n'+
                '回复 search,进入语音搜电影\n'+
                '回复 电影名字,查询电影信息\n'+
                '回复 语音,查询电影信息'+
                '也可以点击<a href="http://sbkgizalow.localtunnel.me/movie">语音查电影</a>';
        }else if(message.Event == 'unsubscribe'){
            console.log('无情取关')
            this.body = '';
        }else if(message.Event == 'LOCATION'){
            this.body = '您上报的位置是:' + message.Latitude + '/' + message.Longitude + '-' + message.Precision;
        }else if(message.Event == 'CLICK'){
            this.body = '您点击了菜单:' + message.EventKey;
        }else if(message.Event =='SCAN'){
            console.log('关注后扫二维码' + message.EventKey+' '+message.Ticket);
            this.body = '看到你扫一下的哦'
        }else if(message.Event =='VIEW'){
            this.body = '您点击了菜单中的链接:' + message.EventKey;
        }else if(message.Event =='scancode_push'){
            console.log(message.ScanCodeInfo.ScanType)
            console.log(message.ScanCodeInfo.ScanResult)
            this.body = '您点击了菜单中的链接:' + message.EventKey;
        }else if(message.Event =='scancode_waitmsg'){
            console.log(message.ScanCodeInfo.ScanType)
            console.log(message.ScanCodeInfo.ScanResult)
            this.body = '您点击了菜单中的链接:' + message.EventKey;
        }else if(message.Event =='pic_sysphoto'){
            console.log(message.SendPicsInfo.PicList)
            console.log(message.SendPicsInfo.Count)
            this.body = '您点击了菜单中的链接:' + message.EventKey;
        }else if(message.Event =='pic_photo_or_album'){
            console.log(message.SendPicsInfo.PicList)
            console.log(message.SendPicsInfo.Count)
            this.body = '您点击了菜单中的链接:' + message.EventKey;
        }else if(message.Event =='pic_weixin'){
            console.log(message.SendPicsInfo.PicList)
            console.log(message.SendPicsInfo.Count)
            this.body = '您点击了菜单中的链接:' + message.EventKey;
        }else if(message.Event == 'location_select'){
            console.log(message.SendLocationInfo.Location_X)
            console.log(message.SendLocationInfo.Location_Y)
            console.log(message.SendLocationInfo.Scale)
            console.log(message.SendLocationInfo.Label)
            console.log(message.SendLocationInfo.Poiname)
            this.body = '您点击了菜单中的链接:' + message.EventKey;
        }
    }else if(message.MsgType == 'text'){
        var content = message.Content;
        var reply = '额，你说的'+content+'太复杂了';
        if(content == '1'){
            reply = '天下第一吃大米<a href="http://sbkgizalow.localtunnel.me/movie">语音搜电影</a>';
        }else if(content == '2'){
            reply = '天下第二吃豆腐';
        }else if(content == '3'){
            reply = '天下第三吃豆腐';
        }else if(content == '4'){
            reply = [{
                title: '技术改变世界',
                description: '只是个描述而已',
                picUrl:'http://img.mukewang.com/56f22f160001bac306000338-240-135.jpg',
                url:'http://www.sooszy.com'
            },{
                title: 'NodeJs',
                description: '1213123',
                picUrl:'http://img.mukewang.com/5707770d0001705706000338-240-135.jpg',
                url:'http://www.sooszy.com'
            }];
        }else{
            var movies = yield Movie.searchByName(content);
            if(!movies || movies.length == 0){
                movies = yield Movie.searchByDouban(content);
            }
            if(movies && movies.length >0 ){
                reply = [];
                movies = movies.slice(0, 10);
                movies.forEach(function(movie){
                    reply.push({
                        title:movie.title,
                        description:movie.title,
                        picUrl:movie.poster,
                        url:'http://15q8m70568.imwork.net:59293/movie/'+movie._id
                    })
                })
            }else{
                reply = '没有查询到与' + content + '匹配的电影，要不要换一个名字试试'
            }
        }
        this.body = reply;
    }else if(message.MsgType == 'voice'){  /*语音查询电影功能*/
        var voiceText = message.Recognition;
        var movies = yield Movie.searchByName(voiceText);
        if(!movies || movies.length == 0){
            movies = yield Movie.searchByDouban(voiceText);
        }
        if(movies && movies.length >0 ){
            reply = [];
            movies = movies.slice(0, 10);
            movies.forEach(function(movie){
                reply.push({
                    title:movie.title,
                    description:movie.title,
                    picUrl:movie.poster,
                    url:'http://15q8m70568.imwork.net:59293/movie/'+movie._id
                })
            })
        }else{
            reply = '没有查询到与' + content + '匹配的电影，要不要换一个名字试试'
        }
        this.body = reply;
    }
    yield next
}