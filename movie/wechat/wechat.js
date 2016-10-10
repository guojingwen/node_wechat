/**
 * Created by admin on 2016/10/3.
 */
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var util = require('../libs/util');
var fs = require('fs');
var _ = require('lodash');
var prefix = 'https://api.weixin.qq.com/cgi-bin/';
var mpPrefix = 'https://mp.weixin.qq.com/cgi-bin/';
/*微信语义接口*/
var semanticUrl = 'https://api.weixin.qq.com/semantic/search?';
/**
 * 接口
 * @type {{accessToken: string, temporary: {upload: string, fetch: string}, permanent: {upload: string, fetch: string, uploadNews: string, uploadNewsPic: string, del: string, update: string, count: string, batch: string}}}
 */
var api = {
    /*获取票据接口*/
    accessToken: prefix + 'token?grant_type=client_credential',
    /*上传临时素材接口*/
    temporary: {
        upload: prefix + 'media/upload?',
        fetch: prefix + 'media/get?'
    },
    /*上传永久素材接口*/
    permanent: {
        upload: prefix + 'material/add_material?',
        fetch: prefix + 'material/get_material?',
        uploadNews: prefix + 'material/add_news?',
        uploadNewsPic: prefix + 'media/uploadimg?',
        del: prefix + 'material/del_material?',
        update: prefix + 'material/update_news?',
        count: prefix + 'material/get_materialcount?',
        batch: prefix + 'material/batchget_material?'
    },
    group: {
        create: prefix + 'groups/create?',
        fetch: prefix + 'groups/get?',
        check: prefix + 'groups/getid?',
        update: prefix + 'groups/update?',
        move: prefix + 'groups/members/update?',
        batchupdate: prefix + 'groups/members/batchupdate?',
        del: prefix + 'groups/delete?'
    },
    user: {
        remark: prefix + 'user/info/updateremark?',
        fetch: prefix + 'user/info?',
        batchFetch: prefix + 'user/info/batchget?',
        list:prefix+'user/get?'
    },
    mass:{
        sendByGroup:prefix + 'message/mass/sendall?',
        openId:prefix + 'message/mass/send?',
        del:prefix + 'message/mass/delete?',
        preview:prefix + 'message/mass/preview?',
        check:prefix + 'message/mass/get?'
    },
    menu:{
        create:prefix+'menu/create?',
        get:prefix + 'menu/get?',
        del:prefix + 'menu/delete?',
        current:prefix + 'get_current_selfmenu_info?'
    },
    qrcode:{
        create:prefix + 'qrcode/create?',
        show:mpPrefix + 'showqrcode?'
    },
    shortUrl:{
        create:prefix + 'shorturl?'
    },
    ticket:{
        get:prefix + 'ticket/getticket?'
    }
};
function Wechat(opts){
    var that = this;
    this.appID = opts.appID;
    this.appSecret = opts.appSecret;
    /*获取 保存全局票据方法*/
    this.getAccessToken = opts.getAccessToken;
    this.saveAccessToken = opts.saveAccessToken;
    /*获取 保存SDK票据方法*/
    this.getTicket = opts.getTicket;
    this.saveTicket = opts.saveTicket;
    this.fetchAccessToken()
}
/**
 * 验证票据是否过期
 * @param data
 * @returns {boolean}
 */
Wechat.prototype.isValidAccessToken = function (data) {
    if (!data || !data.access_token || !data.expires_in) {
        return false
    }
    var access_token = data.access_token;
    var expires_in = data.expires_in;
    var now = (new Date().getTime());
    if (now < expires_in) {
        return true
    } else {
        return false
    }
};
/**
 * 验证SDK票据是否过期
 * @param data
 * @returns {boolean}
 */
Wechat.prototype.isValidTicket = function (data) {
    if (!data || !data.access_token || !data.expires_in) {
        return false
    }
    var ticket = data.ticket;
    var expires_in = data.expires_in;
    var now = (new Date().getTime());
    if (ticket && now < expires_in) {
        return true
    } else {
        return false
    }
};
/**
 * 更新票据方法
 */
Wechat.prototype.updateAccessToken = function () {
    var appID = this.appID;
    var appSecret = this.appSecret;
    var url = api.accessToken + '&appid=' + appID + '&secret=' + appSecret;
    return new Promise(function (resolve, reject) {
        request({url: url, json: true}).then(function (response) {
            var data = response.body;
            var now = (new Date().getTime());
            var expires_in = now + (data.expires_in - 20) * 1000;
            data.expires_in = expires_in;
            resolve(data)
        })
    })
};
/**
 * 更新SDK票据方法
 */
Wechat.prototype.updateTicket = function (access_token) {
    var url = api.ticket.get + '&access_token=' + access_token + '&type=jsapi';
    return new Promise(function (resolve, reject) {
        request({url: url, json: true}).then(function (response) {
            var data = response.body;
            var now = (new Date().getTime());
            var expires_in = now + (data.expires_in - 20) * 1000;
            data.expires_in = expires_in;
            resolve(data)
        })
    })
};
/**
 * 获取更新的票据
 * @param data
 * @returns {Promise.<Wechat>}
 */
Wechat.prototype.fetchAccessToken = function () {
    var that = this;
    return this.getAccessToken().then(function (data) {
        try {
            data = JSON.parse(data);
        } catch (e) {
            return that.updateAccessToken();
        }
        if (that.isValidAccessToken(data)) {
            return Promise.resolve(data)
        } else {
            return that.updateAccessToken();
        }
    }).then(function (data) {
        that.access_token = data.access_token;
        that.expires_in = data.expires_in;
        that.saveAccessToken(data);
        return Promise.resolve(data);
    })
};
/**
 * 获取 SDK 票据
 * @param access_token 全局票据
 */
Wechat.prototype.fetchTicket = function (access_token) {
    var that = this;
    return this.getTicket().then(function (data) {
        try {
            data = JSON.parse(data);
        } catch (e) {
            return that.updateTicket(access_token);
        }
        if (that.isValidTicket(data)) {
            return Promise.resolve(data)
        } else {
            return that.updateTicket(access_token);
        }
    }).then(function (data) {
        that.saveTicket(data);
        return Promise.resolve(data);
    })
};
/**
 * 上传素材方法
 * @param type 类型
 * @param material 地址
 * @param permanent 永久素材json
 */
Wechat.prototype.uploadMaterial = function (type,material,permanent) {
    var that = this;
    var form = {};
    var uploadUrl = api.temporary.upload;
    if(permanent){
        uploadUrl = api.permanent.upload;
        _.extend(form,permanent)
    }
    if(type=='pic'){
        uploadUrl = api.permanent.uploadNewsPic;
    }
    if(type == 'news'){
        uploadUrl = api.permanent.uploadNews;
        form = material;
    }else{
        form.media = fs.createReadStream(material)
    }
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = uploadUrl + 'access_token=' + data.access_token;
                if(!permanent){
                    url += '&type=' + type;
                }else{
                    form.access_token = data.access_token;
                }
                var options = {
                    method: 'POST',
                    url:url,
                    json:true
                };
                if(type == 'news'){
                    options.body = form;
                }else{
                    options.formData = form;
                }
                request(options).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('Upload material fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};
/**
 * 获取素材方法
 * @param mediaId  素材id
 * @param type  素材类型
 * @param permanent 永久素材json
 */
Wechat.prototype.fetchMaterial = function (mediaId,type,permanent) {
    var that = this;
    var form = {};
    var fetchUrl = api.temporary.fetch;
    if(permanent){
        fetchUrl = api.permanent.fetch;
    }
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = fetchUrl + 'access_token=' + data.access_token + '&media_id='+mediaId;
                var form = {};
                var options = {method: 'POST', url: url, json: true};
                if(permanent){
                    form.media_id = mediaId;
                    form.access_token = data.access_token;
                    options.body = form;
                }else{
                    if(type=='video'){
                        url = url.replace('https://', 'http://');
                    }
                    url += '&media_id' + mediaId;
                }
                if(type == 'news' || type=='video'){
                    request(options).then(function(response){
                        var _data = response.body;
                        if(_data){
                            resolve(_data)
                        }else{
                            throw new Error('Delete material fails')
                        }
                    }).catch(function(err){
                        reject(err)
                    })
                }else{
                    resolve(url)
                }

            })
    })
};
/**
 * 删除永久素材方法
 * @param mediaId  素材id
 */
Wechat.prototype.deleteMaterial = function (mediaId) {
    var that = this;
    var form = {
        media_id:mediaId
    };
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = api.permanent.del + 'access_token=' + data.access_token + '&media_id='+mediaId;
                request({method:'POST',url:url,body:form,json:true}).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('Delete material fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};
/**
 * 更新永久素材方法
 * @param mediaId  素材id
 * @param news  新素材
 */
Wechat.prototype.updateMaterial = function (mediaId,news) {
    var that = this;
    var form = {
        media_id:mediaId
    };
    _.extend(form, news);
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = api.permanent.update + 'access_token=' + data.access_token + '&media_id='+mediaId;
                request({method:'POST',url:url,body:form,json:true}).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('Delete material fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};
/**
 * 获取永久素材数量方法
 */
Wechat.prototype.countMaterial = function () {
    var that = this;
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = api.permanent.count + 'access_token=' + data.access_token;
                request({method:'GET',url:url,json:true}).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('Count material fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};
/**
 * 获取永久素材列表方法
 * @param options  获取配置参数json
 */
Wechat.prototype.batchMaterial = function (options) {
    var that = this;
    options.type = options.type || 'image';
    options.offset = options.offset || 0;
    options.count = options.count || 1;

    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = api.permanent.batch + 'access_token=' + data.access_token;
                request({method:'POST',url:url,body:options,json:true}).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('Batch material fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};
/**
 * 创建用户分组方法
 * @param name  用户组名
 */
Wechat.prototype.createGroup = function (name) {
    var that = this;
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = api.group.create + 'access_token=' + data.access_token;
                var options = {
                    group: {
                        name: name
                    }
                };
                request({method:'POST',url:url,body:options,json:true}).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('CreateGroup fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};
/**
 * 获取用户分组方法
 * @param name  用户组名
 */
Wechat.prototype.fetchGroup = function (name) {
    var that = this;
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = api.group.fetch + 'access_token=' + data.access_token;
                request({url:url,json:true}).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('CreateGroup fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};
/**
 * 检测用户在哪个分组方法
 * @param openId  用户openId
 */
Wechat.prototype.checkGroup = function (openId) {
    var that = this;
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = api.group.check + 'access_token=' + data.access_token;
                var options = {
                    openid: openId
                };
                request({method:'POST',url:url,body:options,json:true}).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('CheckGroup fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};
/**
 * 更新用户分组方法
 * @param id  分组id
 * @param name  组名
 */
Wechat.prototype.updateGroup = function (id,name) {
    var that = this;
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = api.group.update + 'access_token=' + data.access_token;
                var options = {
                    group: {
                        id: id,
                        name: name
                    }
                };
                request({method:'POST',url:url,body:options,json:true}).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('UpdateGroup fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};

/**
 * 批量与单个移动用户分组方法
 * @param openId  用户openid
 * @param to  组id
 */
Wechat.prototype.moveGroup = function (openIds,to) {
    var that = this;
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url;
                var options = {
                    to_groupid: to
                };
                if(_.isArray(openIds)){   //批量移动方法
                    url = api.group.batchupdate + 'access_token=' + data.access_token;
                    options.openid_list = options;
                }else{      //单个组移动
                    url = api.group.move + 'access_token=' + data.access_token;
                    options.openid = openIds;
                }

                request({method:'POST',url:url,body:options,json:true}).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('MoveGroup fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};


/**
 * 删除用户分组方法
 * @param id  分组id
 */
Wechat.prototype.deleteGroup = function (id) {
    var that = this;
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = api.group.del + 'access_token=' + data.access_token;
                var options = {
                    group: {
                        id: id
                    }
                };
                request({method:'POST',url:url,body:options,json:true}).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('DeleteGroup fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};
/**
 * 重命名用户方法
 * @param openId  用户openid
 * @param remark  新标记名
 */
Wechat.prototype.remarkUser = function (openId,remark) {
    var that = this;
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = api.user.remark + 'access_token=' + data.access_token;
                var options = {
                    openid: openId,
                    remark: remark
                };
                request({method:'POST',url:url,body:options,json:true}).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('RemarkUser fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};
/**
 * 批量获取用户信息方法
 * @param openIds  用户openid数组
 */
Wechat.prototype.fetchUsers = function (openIds,lang) {
    var that = this;
    lang = lang || 'zh_CN';
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var options = {
                    json:true
                };
                if(_.isArray(openIds)){
                    options.url = api.user.batchFetch + 'access_token=' + data.access_token;
                    options.body = {
                        user_list: openIds
                    };
                    options.method = 'POST';
                }else{
                    options.url = api.user.fetch + 'access_token=' + data.access_token + '&openid=' + openIds + '&lang=' + lang;
                    options.method = 'GET';
                }
                request(options).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('FetchUsers fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};
/**
 * 批量获取用户信息方法
 * @param openIds  用户openid数组
 */
Wechat.prototype.listUsers = function (openId) {
    var that = this;
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = api.user.list + 'access_token=' + data.access_token;
                if(openId){
                    url += '&next_openid' + openId;
                }
                request({method:'GET',url:url,json:true}).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('ListUsers fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};
/**
 * 标签群发
 * @param type  消息类型
 * @param message  消息内容
 * @param groupId  分组id
 */
Wechat.prototype.sendByGroup = function (type,message,groupId) {
    var that = this;
    var msg = {
        filter: {},
        msgtype: type
    };
    msg[type] = message;
    if(!groupId){
        msg.filter.is_to_all = true;
    }else{
        msg.filter ={
            is_to_all:false,
            group_id:groupId
        };
    }
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = api.mass.sendByGroup + 'access_token=' + data.access_token;
                request({method:'POST',url:url,body:msg,json:true}).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('SendByGroup fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};
/**
 * 用户openid群发
 * @param type  消息类型
 * @param message  消息内容
 * @param openIds  用户openId数组
 */
Wechat.prototype.sendByOpenId = function (type,message,openIds) {
    var that = this;
    var msg = {
        msgtype: type,
        touser: openIds
    };
    msg[type] = message;
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = api.mass.openId + 'access_token=' + data.access_token;
                request({method:'POST',url:url,body:msg,json:true}).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('SendByOpenId fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};
/**
 * 删除群发
 * @param msgId  消息id
 */
Wechat.prototype.deleteMass = function (msgId) {
    var that = this;
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = api.mass.del + 'access_token=' + data.access_token;
                var options = {
                    msg_id: msgId
                };
                request({method:'POST',url:url,body:options,json:true}).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('DeleteMass fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};
/**
 * 预览群发
 * @param type  消息类型
 * @param message  消息内容
 * @param openId  用户openId
 */
Wechat.prototype.previewMass = function (type,message,openId) {
    var that = this;
    var msg = {
        msgtype: type,
        touser: openId
    };
    msg[type] = message;
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = api.mass.preview + 'access_token=' + data.access_token;
                request({method:'POST',url:url,body:msg,json:true}).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('PreviewMass fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};
/**
 * 检测群发状态
 * @param msgId  消息id
 */
Wechat.prototype.checkMass = function (msgId) {
    var that = this;
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = api.mass.check + 'access_token=' + data.access_token;
                var options = {
                    msg_id: msgId
                };
                request({method:'POST',url:url,body:options,json:true}).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('CheckMass fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};
/**
 * 创建菜单方法
 * @param menu  menu对象
 */
Wechat.prototype.createMenu = function (menu) {
    var that = this;
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = api.menu.create + 'access_token=' + data.access_token;
                request({method:'POST',url:url,body:menu,json:true}).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('CreateMenu fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};
/**
 * 获取菜单方法
 */
Wechat.prototype.getMenu = function () {
    var that = this;
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = api.menu.get + 'access_token=' + data.access_token;
                request({method:'GET',url:url,json:true}).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('GetMenu fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};
/**
 * 删除菜单方法
 */
Wechat.prototype.deleteMenu = function () {
    var that = this;
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = api.menu.del + 'access_token=' + data.access_token;
                request({method:'GET',url:url,json:true}).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('DeleteMenu fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};
/**
 * 获取自定义菜单配置
 */
Wechat.prototype.getCurrentMenu = function () {
    var that = this;
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = api.menu.current + 'access_token=' + data.access_token;
                request({method:'GET',url:url,json:true}).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('GetCurrent Menu fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};
/**
 * 创建二维码方法
 */
Wechat.prototype.createQrcode = function (qr) {
    var that = this;
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = api.qrcode.create + 'access_token=' + data.access_token;
                request({method:'POST',url:url,body:qr,json:true}).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('GetCurrent Menu fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};

/**
 * 展示二维码链接方法
 */
Wechat.prototype.showQrcode = function (ticket) {
    return api.qrcode.show + 'ticket=' + encodeURI(ticket);
};

/**
 * 创建二维码方法
 */
Wechat.prototype.createShortUrl = function (action,longurl) {
    action = action || 'long2short';
    var that = this;
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = api.shortUrl.create + 'access_token=' + data.access_token;
                var options = {
                    action: urlType,
                    long_url: longurl
                };
                request({method:'POST',url:url,body:options,json:true}).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('CreateShortUrl Menu fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};
/**
 * 语义搜索方法方法
 */
Wechat.prototype.semantic = function (semanticData) {
    var that = this;
    return new Promise(function(resolve,reject){
        that
            .fetchAccessToken()
            .then(function(data){
                var url = semanticUrl + 'access_token=' + data.access_token;
                semanticData.appid = data.appID;
                request({method:'POST',url:url,body:semanticData,json:true}).then(function(response){
                    var _data = response.body;
                    if(_data){
                        resolve(_data)
                    }else{
                        throw new Error('Semantic fails')
                    }
                }).catch(function(err){
                    reject(err)
                })
            })
    })
};
/**
 * 回复用户方法
 */
Wechat.prototype.reply = function () {
    var content = this.body;
    var message = this.weixin;
    /**
     * 处理回复用户的模板
     * */
    var xml = util.tpl(content, message);
    this.status = 200;
    this.type = 'application/xml';
    this.body = xml;
};

module.exports = Wechat;