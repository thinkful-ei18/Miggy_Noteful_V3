// 'use strict';
//
// const app = require('../server');
// const chai = require('chai');
// const chaiHttp = require('chai-http');
// const mongoose = require('mongoose');
// const jwt = require('jsonwebtoken');
//
// const { TEST_MONGODB_URI, JWT_SECRET } = require('../config');
//
// const User = require('../models/user');
// const expect = chai.expect;
//
// const Note = require('../models/note');
// const seedNotes = require('../db/seed/notes.json');
//
// chai.use(chaiHttp);
//
// let token;
//
// let id;
// const _id = '555555555555555555550001';
// const username = 'exampleUser';
// const password = 'examplePass';
// const fullname = 'Example User';
//
// describe('Noteful', function () {
//
//   before(function () {
//     return mongoose.connect(TEST_MONGODB_URI)
//       .then(() => mongoose.connection.db.dropDatabase());
//   });
//
//   beforeEach(function () {
//     return Note.insertMany(seedNotes)
//       .then(() => Note.ensureIndexes())
//       .then(()=>{return User.hashPassword(password);})
//       .then(digest => User.create({ _id,username, password: digest, fullname }))
//       .then(user => {
//         id = user.id;
//         token = jwt.sign({ user }, JWT_SECRET, { subject: user.username});
//       });
//   });
//
//   afterEach(function () {
//     return mongoose.connection.db.dropDatabase();
//   });
//
//   after(function () {
//     return mongoose.disconnect();
//   });
//
//   describe('Noteful', function () {
//     it('Should return a valid auth token', function () {
//       return chai
//         .request(app)
//         .post('/v3/login')
//         .send({ username, password })
//         .then(res => {
//           expect(res).to.have.status(200);
//           expect(res.body).to.be.an('object');
//           const token = res.body.authToken;
//           expect(token).to.be.a('string');
//           const payload = jwt.verify(token, JWT_SECRET);
//           expect(payload.user).to.deep.equal({ id, username, fullname });
//         });
//     });
//
//     it('should response with protected data', function () {
//       return chai.request(app)
//         .get('/v3/notes')
//         .set('Authorization', `Bearer ${token}`)
//         .then(res => {
//           expect(res).to.have.status(200);
//           expect(res.body).to.be.an('array');
//         });
//     });
//
//   });
// });
