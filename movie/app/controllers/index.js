var Movie = require('../models/movie') ;
var Category = require('../models/category') ;
var movieApi = require('../api/movie') ; 
//index page
exports.index = function *(){
	var categories = yield movieApi.findAll() ; 
	yield this.render('pages/index' , {
		title:'Movie首页' , 
		categories: categories
	})
}


//search page
exports.search = function *(){
	var catId = this.query.cat ; 
	var page = parseInt(this.query.p , 10) || 1 ; 
	var q = this.query.q ; 
	var count = 2 ; 
	var index = (page-1) * count ; 
	if(catId){
			var categories = yield movieApi.searchByCategory(catId) ; 
			var category = categories[0] || {} ; 
			var movies = category.movies || [] ;
			var results = movies.slice(index, index + count) ; 
			yield this.render('pages/results' , {
				title:'Movie 分类列表页' , 
				keyword: category.name ,
				currentPage: page , 
				query: 'cat=' + catId , 
				totalPage: Math.ceil(movies.length / count) , 
				movies: results
			})
	}
	else{
		var movies = movieApi.searchByName(q) ; 
		var results = movies.slice(index, index + count) ; 
		yield this.render('pages/results' , {
			title:'Movie 分类列表页' , 
			keyword: q ,
			currentPage: page , 
			query: 'q=' + q , 
			totalPage: Math.ceil(movies.length / count) , 
			movies: results
		})
	}
}