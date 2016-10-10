'use strict'
var mongoose = require('mongoose') ; 
var User = mongoose.model('User') ;
//user signup
exports.signup = function *(next){
	var _user = this.request.body.user ; 
	yield user = User.find({name: _user.name}).exec() ; 
	//console.log(user) ;
	if(user.name){
		//如果说已经注册过的话，直接跳转到登录
		this.redirect('/login') ;
		return next ; 
	}else{
		var user = new User(_user) ; 
		yield user.save() ;
		this.session.user = user ;
		this.redirect('/') ; 
	}
}


//user login
exports.login = function *(next){
	//console.log('i am coming') ;
	var _user = this.request.body.user ; 
	var username = _user.name ; 
	var userpassword = _user.password ;
	var user = yield User.findOne({name:username}).exec() ; 
	if(!user){
		//如果说没有找到，返回注册界面
		this.redirect('/signup') ; 
	}
	var isMatched = yield user.comparePassword(userpassword , user.password) ; 
	//console.log(isMatched) ;
	if(isMatched){
		this.session.user = user ; 
		console.log('password is matched') ;
		this.redirect('/') ;
	}else{
		this.redirect('/signup') ;
		console.log('password is not matched') ;
	}

}

//user logout
exports.logout = function *(next){
	delete this.session.user ; 
	this.redirect('/')
	//delete app.locals.usthis.redirect('pages/') ;
}

//admin user list
exports.list = function *(next){
	var users = yield User
		.find({})
		.sort('meta.updateAt')
		.exec() ;
	this.render('userlist' , {
		title:'Movie 用户列表页面' , 
		users:users
	})
}

//user showlogin
exports.showLogin = function *(next){
	this.render('pages/login' , {
		title: '用户登陆页面'
	})
}

//user showlogin
exports.showSignup = function *(next){
	this.render('pages/signup' , {
		title: '用户注册页面'
	})
}

//middleware for user
exports.loginRequired = function *(next){
	var user = this.session.user ; 
	if(!user){
		this.redirect('/login') ; 
	}
	else {
		yield next 
	}
	
}

exports.adminRequired = function *(next){
	var user = this.session.user ; 

	if(user.role <= 10){
		this.redirect('/login') ; 
	}
	else {
		yield next ; 
	}
	
}

