var mongoose = require('mongoose')
var Schema = mongoose.Schema ; 
var ObjectId = Schema.Types.ObjectId ; 
var commentSchema = new Schema({
	movie:{type: ObjectId ,ref: 'Movie'} ,
	from:{type: ObjectId ,ref: 'User'} , //这条评论是从哪里来的
	reply: [{
		from: {type: ObjectId ,ref: 'User'} ,
		to: {type: ObjectId ,ref: 'User'} ,
		content: String 
	}] ,
	content: String ,
	meta:{
		createAt: {
			type: Date , 
			default: Date.now()
		} , 
		updateAt: {
			type: Date , 
			default: Date.now()
		}
	} 
})

commentSchema.pre('save' , function(next){
	if(this.isNew){
		this.meta.createAt = this.meta.updateAt = Date.now()
	}else{
		this.meta.updateAt = Date.now()
	}
	next()    //这样才能将存储流程走下去
})

commentSchema.statics = {
	fetch: function(cb){
		return this
			.find({})
			.sort('meta.updateAt')
			.exec(cb)
	},
	findById: function(id , cb){
		return this
			.findOne({_id:id})
			.exec(cb)
	}
}

module.exports = commentSchema