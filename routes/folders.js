'use strict';
const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

const Folder = require('../models/folder');
const Note = require('../models/note');
const passport = require('passport');

router.use(passport.authenticate('jwt', { session: false, failWithError: true }));


router.get('/folders',(req, res, next) => {
  const userId = req.user.id;
  Folder.find({userId})
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

router.get('/folders/:id',(req,res,next) => {
  const {id} = req.params;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  return Folder.findOne({_id:id, userId})
    .select('id name userId')
    .then((results) => {
      if(results){
        res.json(results);
      }
      else {
        next();
      }
    })
    .catch((err) => {
      next(err);
    });
});

router.post('/folders',(req,res,next) => {
  const newFolder = {name:req.body.name,userId:req.user.id};

  if(!newFolder.name){
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  Folder.create(newFolder)
    .then((result) => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch((err) => {
      if(err.code===11000){
        err = new Error ('The folder already exists!');
        err.status = 400;
      }
      next(err);
    });

});

router.put('/folders/:id',(req,res,next) => {
  const updateFolder = {name:req.body.name,userId:req.user.id};

  if(!updateFolder){
    const err = new Error('Missing `name ` in request body');
    err.status = 400;
    return next(err);
  }
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Folder.findByIdAndUpdate(req.params.id ,updateFolder,{new:true})
    .select('name')
    .then((result) => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch((err) => {
      if(err.code ===11000){
        err = new Error('The folder already exists!');
        err.status = 400;
      }
      next(err);
    });
});

router.delete('/folders/:id',(req,res,next) => {

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Folder.findByIdAndRemove(req.params.id)
    .then(() => {
      return Note.update({},{$set:{'folderId':null}},{multi:true});
    })
    .then((result) => {
      res.location(`${req.originalUrl}/${result.id}`).status(204).end();
    })
    .catch((err) => {
      next(err);
    });
});


module.exports = router;
