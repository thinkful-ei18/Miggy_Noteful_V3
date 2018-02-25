'use strict';
const app = require('../server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
//chai stuff
const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiSpies = require('chai-spies');
const expect = chai.expect;
chai.use(chaiHttp);
chai.use(chaiSpies);

const { TEST_MONGODB_URI, JWT_SECRET} = require('../config');


//models and seed data
const Folder = require('../models/folder');
const seedFolders = require('../db/seed/folders');
const User = require('../models/user');

let token;
let id;
const _id = '555555555555555555550001';
const username = 'exampleUser';
const password = 'examplePass';
const fullname = 'Example User';




describe('Noteful, Folders Test',function () {
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI, { autoIndex: false });
  });

  beforeEach(function () {
    return Folder.insertMany(seedFolders)
      .then(() => Folder.ensureIndexes())
      .then(() => {
        return User.hashPassword(password);
      })
      .then((digest) => {
        return User.create({_id,username,password:digest,fullname});

      })
      .then((user) => {
        id = user.id;
        token = jwt.sign({ user }, JWT_SECRET, {subject: user.username});
      });
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });


  describe('GET /folders',() => {
    it('Should give back a correct ammount of folders',() => {
      const dbPromise = Folder.find();
      const apiPromise = chai.request(app).get('/v3/folders')
        .set('Authorization', `Bearer ${token}`);
      return Promise.all([dbPromise,apiPromise])
        .then(([data,res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });
  });

  describe('GET /folders/:id',() => {
    it('Should give back one folder given a proper id',() => {
      let data;
      return Folder.findOne().select('id name')
        .then((_data) => {
          data = _data;
          return chai.request(app).get(`/v3/folders/${data.id}`).set('Authorization', `Bearer ${token}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
        });
    });

    it('Should give a 400 error and proper message on bad id',() => {
      const spy = chai.spy();
      return chai.request(app).get('/v3/folders/666')
        .set('Authorization', `Bearer ${token}`)
        .then(spy)
        .then(() => {
          expect(spy).to.not.have.been.called();
        })
        .catch((err) => {
          const res = err.response;
          expect(res).have.status(400);
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });

    it('Should give 404 on proper but non existent id',() => {
      const spy = chai.spy();
      return chai.request(app)
        .get('/v3/folders/111111111111111111111105')
        .set('Authorization', `Bearer ${token}`)
        .then(spy)
        .then(() => {
          expect(spy).to.not.have.been.called();
        })
        .catch((err) => {
          const res = err.response;
          expect(res).to.have.status(404);
          expect(res.body.message).to.equal('Not Found');
        });
    });
  });

  describe('POST /v3/folders',() => {
    it('Should return 201 and proper name on folder creation',() => {
      const newTestFolder = {
        'name':'new folder name'
      };
      let body;
      return chai.request(app).post('/v3/folders')
        .set('Authorization', `Bearer ${token}`)
        .send(newTestFolder)
        .then((res) => {
          body = res.body;
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(body).to.be.a('object');
          expect(body).to.have.keys('id','name','userId');
          return Folder.findById(body.id);
        })
        .then((res) => {
          expect(res.name).to.equal(body.name);
        });
    });

    it('Should return 400 status and give message for missing `name` key ',() => {
      const badFolder = {
        'foo':'this should error out'
      };
      const spy = chai.spy();
      return chai.request(app).post('/v3/folders')
        .set('Authorization', `Bearer ${token}`)
        .send(badFolder)
        .then(spy)
        .then(() => {
          expect(spy).to.not.have.been.called();
        })
        .catch((err) => {
          const res = err.response;
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });

    it('Should return 400 on a duplicate folder that exists',() => {
      const validFolder ={
        'name':'existing'
      };
      const duplicateFolder = {
        'name':'existing'
      };
      let data;
      const spy = chai.spy();
      return chai.request(app).post('/v3/folders/')
        .set('Authorization', `Bearer ${token}`)
        .send(validFolder)
        .then((res) => {
          return chai.request(app).post('/v3/folders/')
            .set('Authorization', `Bearer ${token}`)
            .send(duplicateFolder);
        })
        .then(spy)
        .then(() => expect(spy).to.not.have.been.called())
        .catch((err) => {
          const res = err.response;
          expect(res).have.status(400);
          // expect(res.body.message).to.equal('The folder already exists!');
        });
    });
  });

  describe('Put /v3/folders/:id',() => {
    it('Should only update the name of the folder',() => {
      const updatedFolder = {
        'name':'updated folder'
      };
      let data ;
      return Folder.findOne()
        .then((res) => {
          data = res;
          return chai.request(app).put(`/v3/folders/${res.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updatedFolder);
        })
        .then((res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.be.a('object');
          expect(res.body.name).to.not.equal(data.name);
          expect(res.body.id).to.equal(data.id);
        });
    });

  });

  describe('DELETE /v3/folders/:id',() => {
    it('Should return 204 and the length of folders should be -1',() => {
      let deleteId;
      let dbLength;
      return Folder.findOne()
        .then((res) => {
          deleteId =res.id;
          const dbPromise = Folder.find;
          const apiPromise = chai.request(app).delete(`/v3/folders/${deleteId}`).set('Authorization', `Bearer ${token}`);
          return Promise.all([dbPromise,apiPromise]);
        })
        .then (([data,res]) => {
          dbLength = data.length;
          expect(res).to.have.status(204);
          return Folder.find();
        })
        .then((res) => {
          expect(res.body).to.not.equal(dbLength);
        });

    });
    it('Should return 400 and tellyou the id is not valid',() => {
      const spy = chai.spy();

      return chai.request(app).delete('/v3/folders/badid')
        .set('Authorization', `Bearer ${token}`)
        .then(spy)
        .then(() => expect(spy))
        .catch((err) => {
          const res =  err.response;
          expect(res).to.have.status(400);
        });
    });
  });

});
