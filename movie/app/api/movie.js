/**
 * Created by admin on 2016/10/6.
 */
var mongoose = require('mongoose');
var koa_request = require('koa-request');
var Promoise = require('bluebird');
var koa_request = require('koa-request');
var request = Promoise.promisify(require('koa-request'));
var Movie = require('../models/movie');
var Category = require('../models/category');
var _ = require('lodash');


//查询所有电影分类
exports.findAll = function *() {
    var categories = yield Category
        .find({})
        .populate({
            path: 'movies',
            select: 'title poster',
            options: {limit: 6}
        })
        .exec();
    return categories;
};

exports.searchByCategory = function *(catId) {
    var categories = yield Category
        .find({_id: catId})
        .populate({
            path: 'movies',
            select: 'title poster',
        })
        .exec();
    return categories;
};
exports.searchByName = function *(q) {
    var movies = yield Movie
        .find({title: new RegExp(q + '.*', 'i')})
        .exec();
    return movies;
};

exports.searchById = function *(id) {
    var movie = yield Movie
        .findOne({_id:id})
        .exec();
    return movie;
};

function updateMovies(movie){
    var options = {
        url:'https://api.douban.com/v2/movie/subject/' + movie.doubanId,
        json: true
    }
    request(options).then(function(response){
        var data = response[1];
        _.extend(movie, {
            country: data.countries[0],
            language: data.language,
            summary: data.summary
        });

        var geners = movie.genres;
        if(genres && genres.length>0){
            var cateArray = [];
            geners.forEach(function(genre){
                cateArray.push(function *(){
                    var cat = Category.findOne({naeme: genre}).exec();
                    if(cat){
                        cat.movies.push(movie._id);
                        yield cat.save()
                    }else{
                        cat = new Category({
                            name:genre,
                            movies:[movie._id]
                        })

                        cat = yield cat.save();
                        movie.category = cat._id;
                        yield movie.save();
                    }
                })
            })
        }else{
            movie.save();
        }
    })
}
//查询所有电影分类
exports.searchByDouban = function *(q) {
    var options = {
        url:'https://api.douban.com/v2/movie/search?q='
    }
    options.url += encodeURIComponent(q);
    var response = yield koa_request(options);
    var data = JSON.parse(response.body);
    var subjects = [];
    var movies = [];
    if(data && data.subjects){
        subjects = data.subjects;
    }
    if(subjects.length >0){
        var queryArray = [];
        subjects.forEach(function(item){
            queryArray.push(function *(){
                var movie = yield Movie.findOne({doubanId:item.id})
                if(movie){
                    movies.push(movie)
                }else{
                    var directors = item.directors || [];
                    var director = directors[0];
                    console.log(director);
                    movie = new Movie({
                        director: director.name || '',
                        title: item.title,
                        doubanId:item.id,
                        poster: item.images.large,
                        year: item.year,
                        geners: item.geners || [],
                    })
                    movie = yield movie.save();
                    movies.push(movie)
                }
            })
        })

        movies.forEach(function(movie){
            updateMovies(movie)
        })
        yield queryArray
    }
    return movies;
};