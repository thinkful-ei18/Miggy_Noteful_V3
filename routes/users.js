'use strict';
const express = require('express');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const router = express.Router();

const User   = require('../models/user');

router.post('/users',(req,res,next) => {
  const{username,password} = req.body;
  const newUser = {username, password};

  return User.create(newUser)
    .then((user) => {
      res.location(`/api/users/${user.id}`).status(201).json(user);
    })
    .catch((err) => {
      //temporary! ==============
      if(err.code ===11000){
        err = new Error ('That username already exists!');
        err.status = 400;
      }
      next(err);
    });
});


module.exports = router;
