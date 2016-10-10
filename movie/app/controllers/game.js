/**
 * Created by admin on 2016/10/6.
 */
var wx = require('../../wx/index');
var util = require('../../libs/util');
var Movie = require('../api/movie');
var wechatApi = wx.getWechat();
exports.guess = function *(next) {
    /*先获取全局票据*/
    var data = yield wechatApi.fetchAccessToken();
    var access_token = data.access_token;
    /*根据全局票据获取SDK票据*/
    var ticketData = yield wechatApi.fetchTicket(access_token);
    var ticket = ticketData.ticket
    var url = this.href;
    /*获取签名数据*/
    var params = util.sign(ticket, url);
    /*将签名数据传入jade模板*/
    yield this.render('wechat/game', params)
};
exports.find = function *(next) {
    var id = this.params.id;
    /*先获取全局票据*/
    var data = yield wechatApi.fetchAccessToken();
    var access_token = data.access_token;
    /*根据全局票据获取SDK票据*/
    var ticketData = yield wechatApi.fetchTicket(access_token);
    var ticket = ticketData.ticket
    var url = this.href;
    /*获取签名数据*/
    var params = util.sign(ticket, url);
    var movie = yield Movie.searchById(id);

    params.movie = movie;
    /*将签名数据传入jade模板*/
    yield this.render('wechat/movie', params)
};
