/**
 * Created by admin on 2016/10/3.
 */
var Koa = require('koa');
var Router = require('koa-router');
var router = new Router();
var game = require('./app/controllers/game');
var wechat = require('./app/controllers/wechat');
var path = require('path');
var mongoose = require('mongoose');
var fs = require('fs');
var dbUrl = 'mongodb://localhost/imooc';
var app = new Koa();
var views = require('koa-views');
/*链接数据库*/
mongoose.connect(dbUrl)
var models_path = __dirname + '/app/models';
var walk = function (path) {
    fs
        .readdirSync(path)
        .forEach(function (file) {
            var newPath = path + '/' + file;
            var stat = fs.statSync(newPath);
            if (stat.isFile()) {
                if (/(.*)\.(js|coffee)/.test(file)) {
                    require(newPath)
                }
            }
            else if (stat.isDirectory()) {
                walk(newPath)
            }
        })
};
walk(models_path)
//初始化菜单
var menu = require('./wx/menu');
var wx = require('./wx/index');
var wechatApi = wx.getWechat();
wechatApi.deleteMenu().then(function(){
    return wechatApi.createMenu(menu)
}).then(function(msg){
    console.log(msg)
});

app.use(views(__dirname + '/app/views', {extension: 'jade'}));

router.get('/movie', game.guess);
router.get('/movie/:id', game.find);
router.get('/', wechat.hear);
router.post('/', wechat.hear);
app.use(router.routes()).use(router.allowedMethods());
app.listen(340);
console.log('Listening:340');
