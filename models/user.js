'use strict';

const mongoose = require('mongoose');
const bcrypt = require ('bcryptjs');
mongoose.Promise = global.Promise;

const userSchema = new mongoose.Schema({
  fullname: {type:String, default:''},
  usernae:{type:String, unique:true,required:true},
  password: {type:String, required:true}
});

userSchema.set('toObject',{
  transform: function(doc, ret){
    ret.id = ret._id;
    delete ret._id;
    delete ret.password;
    delete ret.__v;
  }
});

userSchema.methods.validatePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.statics.hashPassword = function (password) {
  return bcrypt.hash(password, 10);
};

module.exports = mongoose.model('User', userSchema);
