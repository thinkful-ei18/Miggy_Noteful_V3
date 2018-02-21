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
  //string type check
  const stringFields = ['username', 'password', 'fullname'];
  const nonStringField = stringFields.find(
    field => field in req.body && typeof req.body[field] !== 'string'
  );
  if (nonStringField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Incorrect field type: expected string',
      location: nonStringField
    });
  }

  //whitespace check
  const explicityTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicityTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );

  if (nonTrimmedField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Cannot start or end with whitespace',
      location: nonTrimmedField
    });
  }


  const sizedFields = {
    username: {
      min: 1
    },
    password: {
      min: 8,
      max: 72
    }
  };
  const tooSmallField = Object.keys(sizedFields).find(
    field =>
      'min' in sizedFields[field] &&
            req.body[field].trim().length < sizedFields[field].min
  );
  const tooLargeField = Object.keys(sizedFields).find(
    field =>
      'max' in sizedFields[field] &&
            req.body[field].trim().length > sizedFields[field].max
  );

  if (tooSmallField || tooLargeField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: tooSmallField
        ? `Must be at least ${sizedFields[tooSmallField]
          .min} characters long`
        : `Must be at most ${sizedFields[tooLargeField]
          .max} characters long`,
      location: tooSmallField || tooLargeField
    });
  }

  //everything is ok with the req body, encryptPW and push to our users db
  return User.hashPassword(password)
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
