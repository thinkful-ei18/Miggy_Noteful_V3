'use strict';

const express = require('express');
// Create an router instance (aka "mini-app")
const router = express.Router();
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const Note = require('../models/note');


/* ========== GET/READ ALL ITEM ========== */
router.get('/notes', (req, res, next) => {
  const { searchTerm, folderId } = req.query;
  console.log(folderId);
  let filter = {};
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

  // console.log(filter);
  console.log('wee',filter);
  Note.find(filter, projection)
    .select('id title created content folderId')
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

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }



  Note.findById(req.params.id)
    .select('id title content folderId')
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

/* ========== POST/CREATE AN ITEM ========== */
router.post('/notes', (req, res, next) => {
  Note.create({
    title:req.body.title,
    content:req.body.content,
    folderId:req.body.folderId
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
      console.log(err);
      res.status(500).json({message:'Internal Server Error'});
    });

});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/notes/:id', (req, res, next) => {
  let {title,content,folderId} = req.body;
  const updatedNote = {title,content,folderId};

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

  Note.findByIdAndUpdate(req.params.id,updatedNote,{new:true})
    .select('id title content')
    .then((response) =>  {
      res.status(201).json(response);
    })
    .catch((err) => {
      console.log('here');
      next(err);
    });

});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/notes/:id', (req, res, next) => {
  Note.findByIdAndRemove(req.params.id)
    .then((response) => {
      if(response){
        res.status(204).end();
      }
      else {
        next();
      }
    });
});
module.exports = router;
