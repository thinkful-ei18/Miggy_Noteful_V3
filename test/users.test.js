'use strict';
const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

const {User} = require('../models/user');

const {TEST_MONGODB_URI} = require('../config');
const mongoose = require('mongoose');


chai.use(chaiHttp);
describe('/v3/user', function() {
  const username = 'exampleUser';
  const password = 'examplePass';
  const fullname = 'John Doe';
  const usernameB = 'exampleUserB';
  const passwordB = 'examplePassB';
  const fullnameB = 'Jane Doe';

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI, { autoIndex: false });
  });

  beforeEach(() => {});

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });


  describe('/v3/users',() => {
    describe('POST',() => {
      it('Should create a new user', () => {
        return chai
          .request(app)
          .post('/v3/users')
          .send({
            username,
            password,
            fullname
          })
          .then((res) => {
            expect(res).to.have.status(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('username','fullname','id');
            expect(res.body.username).to.equal(username);
            expect(res.body.fullname).to.equal(fullname);
          });

      });

      it('Should not allow a missing user name',() => {
        return chai
          .request(app)
          .post('/v3/users')
          .send({
            password,
            fullname
          })
          .then(() => {
            expect.fail(null,null, 'Request should not succeed');
          })
          .catch((err) => {
            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.location).to.equal('username');
          });
      });
      it('Should not allow missing password',() => {
        return chai
          .request(app)
          .post('/v3/users')
          .send({
            username,
            fullname
          })
          .then(() => {
            expect.fail(null,null, 'Request should not succeed');
          })
          .catch((err) => {
            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.location).to.equal('password');
          });
      });
      it('Should not allow whitespce in the username',() => {
        return chai
          .request(app)
          .post('/v3/users')
          .send({
            username: ` ${username}`,
            password,
            fullname
          })
          .then(() => {
            expect.fail(null,null, 'Request should not succeed');
          })
          .catch((err) => {
            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.location).to.equal('username');
          });
      });

      it('Should not allow non-string username',() => {
        return chai
          .request(app)
          .post('/v3/users')
          .send({
            username:1234,
            password,
            fullname
          })
          .then(() => {
            expect.fail(null,null, 'Request should not succeed');
          })
          .catch((err) => {
            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.location).to.equal('username');
          });
      });

      it('should not allow short passwords',() => {
        return chai
          .request(app)
          .post('/v3/users')
          .send({
            username,
            password:'123',
            fullname
          })
          .then(() => {
            expect.fail(null,null, 'Request should not succeed');
          })
          .catch((err) => {
            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.location).to.equal('password');
          });
      });
      it('should not allow long passwords',() => {
        return chai
          .request(app)
          .post('/v3/users')
          .send({
            username,
            password:new Array(73).fill('a').join(''),
            fullname
          })
          .then(() => {
            expect.fail(null,null, 'Request should not succeed');
          })
          .catch((err) => {
            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.location).to.equal('password');
          });
      })

    });
  });
});
