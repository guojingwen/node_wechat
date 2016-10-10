'use strict'


var Index = require('../app/controllers/index')
var User = require('../app/controllers/user')
var Movie = require('../app/controllers/movie')
var Comment = require('../app/controllers/comment')
var Category = require('../app/controllers/category')
var Game = require('../app/controllers/game') ; 
var wechat = require('../app/controllers/wechat') ; 
var koaBody = require('koa-body') ;
module.exports = function(router) {
  // Index
  router.get('/', Index.index)
  // User
  router.post('/user/signup', User.signup)
  router.post('/user/login', User.login)
  router.get('/login', User.showLogin)
  router.get('/signup', User.showSignup)
  router.get('/logout', User.logout)
  router.get('/admin/user/list', User.loginRequired, User.adminRequired, User.list)

  // wechat
  router.get('/wechat/movie' , Game.guess) ; 
  router.get('/wechat/jump/:id' , Game.jump) ; 
	router.get('/wechat/movie/:id' , Game.find) ; 
	router.get('/wx' , wechat.hear) ;
	router.post('/wx' , wechat.hear) ;
  // Movie
  router.get('/movie/:id', Movie.detail)
  router.get('/admin/movie/new', User.loginRequired, User.adminRequired, Movie.new)
  router.get('/admin/movie/update/:id', User.loginRequired, User.adminRequired, Movie.update)
  router.post('/admin/movie', User.loginRequired, User.adminRequired,koaBody({multipart: true}) , Movie.savePoster, Movie.save)
  router.get('/admin/movie/list', User.loginRequired, User.adminRequired, Movie.list)
  router.delete('/admin/movie/list', User.loginRequired, User.adminRequired, Movie.del)

  // Comment
  router.post('/user/comment', User.loginRequired, Comment.saveComment)

  // Category
  router.get('/admin/category/new', User.loginRequired, User.adminRequired, Category.new)
  router.post('/admin/category', User.loginRequired, User.adminRequired, Category.save)
  router.get('/admin/category/list', User.loginRequired, User.adminRequired, Category.list)

  // results
  router.get('/results', Index.search)
}