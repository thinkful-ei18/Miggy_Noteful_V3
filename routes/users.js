'use strict';
const express = require('express');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const router = express.Router();

const User = require('../models/user');

router.post('/users',(req,res,next) => {
  const { username, password ,fullname } = req.body;

  //required fields check
  const requiredFields = ['username','password'];
  const missingField = requiredFields.find((field) => !(field in req.body));
  if(missingField){
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: missingField
    });
  }
  return User.find({username})
    .count()
    .then(count => {
      if (count > 0) {
        // There is an existing user with the same username
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Username already taken',
          location: 'username'
        });
      }
      // If there is no existing user, hash the password
      return User.hashPassword(password);
    })
    .then((digest) => {
      const newUser = {
        username,
        password:digest,
        fullname
      };
      return User.create(newUser);
    })
    .then((user) => {
      res.location(`/api/users/${user.id}`).status(201).json(user);
    })
    .catch((err) => {
      if(err.code ===11000){
        err = new Error ('That username already exists!');
        err.status = 400;
      }
      next(err);
    });
});


module.exports = router;
