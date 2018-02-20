'use strict';


const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const User = require ('../models/user');

const localStrategy = new LocalStrategy((username, password, done) => {
  User.findOne({ username })
    .then(user => {
      if (!user) {
        return Promise.reject({
          reason: 'LoginError',
          message: 'Incorrect username',
          location: 'username'
        });
      }
      const isValid = user.validatePassword(password);
      if (!isValid) {
        return Promise.reject({
          reason:'LoginError',
          message: 'Incorrect password',
          location: ''
        });
      }
      return done(null, user);
    })
    .catch(err => {
      if (err.reason === 'LoginError') {
        return done(null, false);
      }

      return done(err);
    });

});
