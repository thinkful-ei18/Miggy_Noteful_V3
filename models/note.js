'use strict';

const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
mongoose.Promise = global.Promise;

const noteSchema = new mongoose.Schema({
  title: { type: String, index: true },
  content: {type:String, index:true },
  created: { type: Date, default: Date.now },
  userId: {type: ObjectId , ref:'User', required:true},
  folderId: {type:ObjectId, ref:'Folder'},
  tags: [{type:ObjectId, ref: 'Tag'}]

});

noteSchema.index({ title: 'text', content: 'text' });

noteSchema.set('toObject', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Note', noteSchema);
