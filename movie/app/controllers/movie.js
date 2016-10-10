'use strict'
var _ = require('lodash')
var mongoose = require('mongoose')
var Movie = mongoose.model('Movie')
var Category = mongoose.model('Category')
var Comment = mongoose.model('Comment')
var fs = require('fs') ; 
var path = require('path')
//detail page
exports.detail = function *(next){
	var id = this.params.id ;
	yield Movie.update({_id: id} , {$inc: {pv: 1}}).exec() ;
	var movie = yield Movie.findOne({_id: id}).exec() ; 
	var comments = yield Comment.find({movie: id})
		.populate('from' , 'name')
		.populate('reply.from reply.to' , 'name')
		.exec() ;
	yield this.render('pages/detail' , {
		title:'movie '+ movie.title,
		movie: movie , 
		comments: comments
	})
}

//list page
exports.list = function *(next){
	var movies = yield Movie.find({})
	.populate({
		path: 'category',
    select: 'name'
	})
	.exec() ; 
	yield this.render('pages/list' , {
		title:'Movie列表页面' , 
		movies:movies
	})
}


//admin page
exports.new = function *(next){
	var categories = yield Category.find({}).exec() ; 
	yield this.render('pages/admin' , {
		title:'movie 后台录入页面' , 
		movie:{} , 
		categories: categories 
	})
}
//admin update movie
exports.update = function *(next) {
  var id = this.params.id

  if (id) {
    var movie = Movie.findOne({_id: id}).exec() ; 
    var categories = yield Category.find({}).exec() ; 
    yield this.render('pages/admin', {
      title: 'imooc 后台更新页',
      movie: movie,
      categories: categories
    })
  }
}
//admin post movie
exports.save = function *(next){
	var movieObj = this.request.body.fields || {}  ; 
	var _movie ; 
	if(this.poster){
		movieObj.poster = this.poster ; 
	}
	if(movieObj._id) {	//如果有id存在的话表明这是在更新
		var movie = yield Movie.findOne({_id: movieObj._id}) ; 
		if(movie == undefined){	//如果没找到就新建
			movie = new Movie(movieObj)
		}
		_movie = _.extend(movie , movieObj)     //_.extend(destination, *sources) 复制source对象中的所有属性覆盖到destination对象上，并且返回 destination 对象. 复制是按顺序的, 所以后面的对象属性会把前面的对象属性覆盖掉(如果有重复).
		movie = yield _movie.save() ; 
			//console.log('转发时的id'+movie._id)
		this.redirect('/detail/'+movie._id)
	}else{	//这里是录入
		_movie = new Movie(movieObj) ; 
		var categoryId = movieObj.category ; 
		var categoryName = movieObj.categoryName ; 
		var movie = yield _movie.save() ; 
		if(categoryId){	//如果传过来了categoryId
			var category = yield Category.findOne({_id: categoryId}).exec() ; 
			category.movies.push(movie._id) ; 
			yield category.save() ;
			this.redirect('/detail/'+ movie._id) ;
		}
		if(categoryName){
			var category = new Category({
				name: categoryName , 
				movies: [movie._id] 
			}) ; c
			category = yield category.save() ; 
			movie.category = category._id ; 
			movie = yield movie.save() ; 
			this.redirect('/detail/'+ movie._id) ;
		}
	}
}


//admin delete
exports.del = function *(next){
	var id = this.query.id 
	if(id){
		try{
			yield Movie.remove({ _id:id }).exec() ;
			this.body = {success: 1} ; 
		}
		catch(err) {
			this.body = {success: 0} ; 
		}
	}
}
var util = require('../../libs/util') ;
//admin movie savePoster

exports.savePoster = function *(next){ 
	var uploadPoster = this.request.body.files.uploadPoster ; 
	var filePath = uploadPoster.path ; 
	var originalname = uploadPoster.name ; 
	var fileType = uploadPoster.type.split('/')[1] ;
	if(originalname){
		var data = yield util.readFileAsync(filePath) ; 
		var timestamp = Date.now() ; 
		var newName = timestamp+ '.' + fileType ; 
		var newPath = path.join(__dirname , '../../' , '/public/upload/'+ newName) ; 
		yield util.writeFileAsync(newPath , data) ; 
		this.poster = newName ;
	}
	yield next ; 
	
}