var mongoose = require('mongoose') ;
var bcrypt = require('bcrypt') ; 
var SALT_WORK_FACTORY = 10 ; 

var userSchema = new mongoose.Schema({
	openid: String ,
	name: {
		unique: true ,
		type: String 
	} , 
	password: String ,
	//role 
	role: {
		type: Number , 
		default: 0
	},
	meta: {
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

userSchema.pre('save' , function(next){
	var user = this ; 
	if(this.isNew){
		this.meta.createAt = this.meta.updateAt = Date.now() ;
	}else{
		this.meta.updateAt = Date.now() ;
	}
	bcrypt.genSalt(SALT_WORK_FACTORY , function(err , salt){
		if (err) {
			return next(err) ;
		}
		bcrypt.hash(user.password , salt , function(err , hash){
			if (err) {
				return next(err) ; 
			}
			//console.log(hash) ;
			user.password = hash ; 
			//console.log(user.password) ;
			next() ; 
		})
	})
})

userSchema.methods = {
	comparePassword : function(_password , password){
		return function(cb) {
			bcrypt.compare(_password , password , function(err , isMatched){
				cb(err , isMatched) ;
			})
		}
	}
}

userSchema.statics = {
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

module.exports = userSchema