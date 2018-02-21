'use strict';
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { JWT_SECRET , JWT_EXPIRY } = require('../config');


const localAuth = passport.authenticate('local', {session: false, failWithError: true}); //stofloHere
const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true });


router.post('/login', localAuth, function (req, res) {
  const authToken = createAuthToken(req.user);
  res.json ({ authToken });
});
router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});


function createAuthToken (user){

  return jwt.sign({ user }, JWT_SECRET, {
    subject: user.username,
    expiresIn:JWT_EXPIRY
  });
}




//custom error messages
// router.use((err,req,res,next) => {
//   const requiredFields = ['username','password'];
//   const missingField = requiredFields.find((field) => !(field in req.body));
//   if(missingField){
//     return res.status(422).json({
//       code: 422,
//       reason: 'ValidationError',
//       message: 'Missing field',
//       location: missingField
//     });
//   }
//   res.json(err);
// });

module.exports = router;
