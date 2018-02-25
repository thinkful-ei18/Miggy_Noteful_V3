'use strict';
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Tag = require('../models/tag');
const Note = require('../models/note');
const passport = require('passport');

router.use(passport.authenticate('jwt', { session: false, failWithError: true }));

router.get('/tags', (req,res,next) => {
  const userId = req.user.id;
  Tag.find({userId})
    .select('id name')
    .sort('name')
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

router.get('/tags/:id',(req,res,next) => {
  const {id} = req.params;
  const userId = req.user.id;
  if(!mongoose.Types.ObjectId.isValid(req.params.id)){
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  Tag.findById({_id:id,userId})
    .select('id name userId')
    .then((results) => {
      if (results) {
        res.json(results);
      }
      else {
        next();
      }
    }).catch(next);
});

router.post('/tags',(req,res,next) => {
  const newTag = {name:req.body.name, userId:req.user.id};

  if(!newTag.name){
    const err = new Error ('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  Tag.create(newTag)
    .then((result) => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch((err) => {
      if(err.code===11000){
        err = new Error ('The tag already exists!');
        err.status = 400;
      }
      next(err);
    });

});

router.put('/tags/:id',(req, res, next) => {
  const updateTag = {name:req.body.name,userId:req.user.id};

  if(!updateTag.name){
    const err = new Error ('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
  if(!mongoose.Types.ObjectId.isValid(req.params.id)){
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Tag.findByIdAndUpdate(req.params.id , updateTag, {new:true})
    .select('name')
    .then((result) => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch((err) => {
      if(err.code ===11000){
        err = new Error('That tag name already exists!');
        err.status = 400;
      }
      next(err);
    });

});

router.delete('/tags/:id',(req,res,next) => {

  if(!mongoose.Types.ObjectId.isValid(req.params.id)){
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Tag.findByIdAndRemove(req.params.id)
    .then(() => {
      return Note.update({},{$pull: {'tags':req.params.id}},{multi: true, new:true});
    })
    .then((result) => {
      if(result.nModified>0){
        res.location(`${req.originalUrl}/${result.id}`).status(201).end();
      }
      else{
        res.location(`${req.originalUrl}/${result.id}`).status(204).end();
      }
    })
    .catch(next);
});

module.exports = router;
