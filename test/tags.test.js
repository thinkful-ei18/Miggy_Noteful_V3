'use strict';
const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiSpies = require('chai-spies');

const expect = chai.expect;
const mongoose = require('mongoose');
const Tag = require('../models/tag');

const { TEST_MONGODB_URI } = require('../config');
const seedTags = require('../db/seed/tags');

chai.use(chaiHttp);
chai.use(chaiSpies);



describe('Noteful API resource, tags test',function () {
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI, { autoIndex: false });
  });

  beforeEach(function () {
    return Tag.insertMany(seedTags)
      .then(() => Tag.ensureIndexes());
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });


  describe('GET /tags',() => {
    it('Should give back a correct ammount of tags',() => {
      const dbPromise = Tag.find();
      const apiPromise = chai.request(app).get('/v3/tags');
      return Promise.all([dbPromise,apiPromise])
        .then(([data,res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });
  });

  describe('GET /tags/:id',() => {
    it('Should give back one tag given a proper id',() => {
      let data;
      return Tag.findOne().select('id name')
        .then((_data) => {
          data = _data;
          return chai.request(app).get(`/v3/tags/${data.id}`);
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
      return chai.request(app).get('/v3/tags/666')
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
      return chai.request(app).get('/v3/tags/111111111111111111111105')
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

  describe('POST /v3/tags',() => {
    it('Should return 201 and proper name on tag creation',() => {
      const newTestTag = {
        'name':'new tag name'
      };
      let body;
      return chai.request(app).post('/v3/tags')
        .send(newTestTag)
        .then((res) => {
          body = res.body;
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(body).to.be.a('object');
          expect(body).to.have.keys('id','name');
          return Tag.findById(body.id);
        })
        .then((res) => {
          expect(res.name).to.equal(body.name);
        });
    });

    it('Should return 400 status and give message for missing `name` key ',() => {
      const badTag = {
        'foo':'this should error out'
      };
      const spy = chai.spy();
      return chai.request(app).post('/v3/tags')
        .send(badTag)
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
    it('Should return 400 on a duplicate tag that exists',() => {
      const validTag ={
        'name':'existing'
      };
      const duplicateTag = {
        'name':'existing'
      };
      let data;
      const spy = chai.spy();
      return chai.request(app).post('/v3/tags/')
        .send(validTag)
        .then((res) => {
          return chai.request(app).post('/v3/tags/')
            .send(duplicateTag);
        })
        .then(spy)
        .then(() => expect(spy).to.not.have.been.called())
        .catch((err) => {
          const res = err.response;
          expect(res).have.status(400);
          // expect(res.body.message).to.equal('The tag already exists!');
        });
    });
  });

  describe('Put /v3/tags/:id',() => {
    it('Should only update the name of the tag',() => {
      const updatedTag = {
        'name':'updated tag'
      };
      let data ;
      return Tag.findOne()
        .then((res) => {
          data = res;
          return chai.request(app).put(`/v3/tags/${res.id}`)
            .send(updatedTag);
        })
        .then((res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.be.a('object');
          expect(res.body.name).to.not.equal(data.name);
          expect(res.body.id).to.equal(data.id);
        });
    });

  });

  describe('DELETE /v3/tags/:id',() => {
    it('Should return 204 and the length of tags should be -1',() => {
      let deleteId;
      let dbLength;
      return Tag.findOne()
        .then((res) => {
          deleteId =res.id;
          const dbPromise = Tag.find;
          const apiPromise = chai.request(app).delete(`/v3/tags/${deleteId}`);
          return Promise.all([dbPromise,apiPromise]);
        })
        .then (([data,res]) => {
          dbLength = data.length;
          expect(res).to.have.status(204);
          return Tag.find();
        })
        .then((res) => {
          expect(res.body).to.not.equal(dbLength);
        });

    });
    it('Should return 400 and tellyou the id is not valid',() => {
      const spy = chai.spy();

      return chai.request(app).delete('/v3/tags/badid')
        .then(spy)
        .then(() => expect(spy))
        .catch((err) => {
          const res =  err.response;
          expect(res).to.have.status(400);
        });
    });
  });

});
