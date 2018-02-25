'use strict';

const express = require('express');
// Create an router instance (aka "mini-app")
const router = express.Router();
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');
const passport = require('passport');

router.use(passport.authenticate('jwt', { session: false, failWithError: true }));

/* ========== GET/READ ALL ITEM ========== */
router.get('/notes', (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;
  const userId = req.user.id;
  let filter = {userId};
  let projection = {};
  let sort = '-created'; // default sorting , -created the desc
  if (searchTerm) {
    filter.$text = { $search: searchTerm };
    projection.score = { $meta: 'textScore' };
    sort = projection;
  }
  if(folderId){
    filter.folderId= folderId;
  }
  if(tagId){
    filter.tags = tagId;
  }


  Note.find(filter, projection)
    .select('id title created content folderId tags')
    .populate('tags')
    .sort(sort)
    .then((results) => {
      if(results){
        res.json(results);
      }
      else{
        next();
      }
    })
    .catch(next);
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }


  Note.findOne({_id:id, userId})
    .select('id title content folderId tags')
    .populate('tags')
    .then((results) => {
      if(results){
        res.json(results);
      }
      else{
        next();
      }
    })
    .catch((err) => {
      next (err)
    });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/notes', (req, res, next) => {
  const {title, content, folderId, tags} = req.body;
  const userId = req.user.id;

  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  if(tags){
    tags.forEach((_tag) => {
      if(!mongoose.Types.ObjectId.isValid(_tag)){
        const err = new Error('The `tag id` is invalid');
        err.status = 400;
        next(err);
      }
    });
  }

  const updateObject = {
    title:title,
    content:content,
    userId:userId,
    folderId:folderId,
    tags:tags
  };
  const folderCheck = validateFolderId(folderId,userId);
  const tagCheck = validateTags(tags,userId);

  return Promise.all([folderCheck,tagCheck])
    .then(() => {
      return Note.create(updateObject);
    })
    .then((response) => {
      if(response){
        return Note.findById(response.id)
          .select('title content created id folderId tags userId')
          .populate('tags');
      }
      else{
        next();
      }
    })
    .then((response) => {
      if(response){
        res.status(201).json(response);
      }
      else{
        next();
      }
    })
    .catch((err) => {

      next(err);
    });

});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/notes/:id', (req, res, next) => {
  let {title,content,folderId,tags} = req.body;
  const userId = req.user.id;
  tags.forEach((_tag) => {
    if(!mongoose.Types.ObjectId.isValid(_tag)){
      const err = new Error('The `tag id` is invalid');
      err.status = 400;
      next(err);
    }
  });

  const updatedNote = {title,content,userId,folderId,tags};

  if (!updatedNote.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  const folderCheck = validateFolderId(folderId,userId);
  const tagCheck = validateTags(tags,userId);

  return Promise.all([folderCheck,tagCheck])
    .then(() => {
      return Note.findByIdAndUpdate(req.params.id,updatedNote,{new:true})
        .select('id title content creted folderId tags')
        .populate('tags');
    })
    .then((response) =>  {
      res.status(201).json(response);
    })
    .catch((err) => {
      next(err);
    });

});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/notes/:id', (req, res, next) => {
  const noteId = req.params.id;
  const userId = req.user.id;
  Note.findByIdAndRemove({_id:noteId,userId})
    .then((response) => {
      if(response){
        res.status(204).end();
      }
      else {
        next();
      }
    });
});

/* ========== Helpers ========== */
function validateFolderId(folderId, userId) {
  if(!folderId){
    return Promise.resolve('valid');
  }
  return Folder.find({_id:folderId,userId})
    .then((result) => {
      if(!result.length){
        return Promise.reject('invalid folder');
      }
    });
}

function validateTags(tagIds, userId){
  if(!tagIds){
    return Promise.resolve('valid');
  }
  return Tag.find({_id:{$in:tagIds},userId})
    .then((result) => {
      if(!result.length){
        return Promise.reject('invalid tag');
      }
    });
}
module.exports = router;
