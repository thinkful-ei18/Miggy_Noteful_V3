'use strict';
const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiSpies = require('chai-spies');

const expect = chai.expect;
const mongoose = require('mongoose');

const Note = require('../models/note');
const {TEST_MONGODB_URI} = require('../config');
const seedNotes = require('../db/seed/notes.json');
console.log(TEST_MONGODB_URI);
chai.use(chaiHttp);
chai.use(chaiSpies);


describe('Noteful API resource',function(){
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI, { autoIndex: false });
  });

  beforeEach(function () {
    return Note.insertMany(seedNotes)
      .then(() => Note.ensureIndexes());
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });


  describe('GET v3/notes/', function () {
    it('should return correct ammount of notes', function () {
      const dbPromise = Note.find();
      const apiPromise = chai.request(app).get('/v3/notes');
      return Promise.all([dbPromise,apiPromise])
        .then(([data,res]) => {

          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });
  });

  describe('Get v3/notes:id', function(){
    it('makes an api call and the note matches the one in DB',() => {
      let data;
      return Note.findOne().select('id title content')

        .then((_data) => {
          //extend the scope of data
          data = _data;
          return chai.request(app).get(`/v3/notes/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id','title','content');

          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
        });
    });
  });

  describe('POST /v3/notes', function(){
    it('should create a new note.',() => {
      const newTestNote={
        'title':'This is a test',
        'content':'This is content for the test',
        'tags':[]
      };
      let body ;

      return chai.request(app).post('/v3/notes/')
        .send(newTestNote)
        .then((res) => {
          body = res.body;
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(body).to.be.a('object');
          expect(body).to.include.keys('title','id','content');

          return Note.findById(body.id);
        })
        .then((res) => {
          expect(res.title).to.equal(body.title);
          expect(res.content).to.equal(body.content);

        });

    });
  });

  describe('Put /V3/notes/:id',() => {
    it('should update a note given a proper id',() => {
      const updateTestNote = {
        'title':'updated title',
        'content':'updated content'
      };
      let data;
      return Note.findOne()
        .then((res) => {
          data = res;
          return chai.request(app).put(`/v3/notes/${data.id}`)
            .send(updateTestNote);
        })
        .then((res) => {
          expect(res.body).to.be.a('object');
          expect(res.body.title).to.not.equal(data.title);
          expect(res.body.content).to.not.equal(data.content);
          expect(res.body.title).to.equal(updateTestNote.title);
          expect(res.body.content).to.equal(updateTestNote.content);

        });

    });
  });

  describe('Delete /v3/notes/:id',() => {
    it('should delete a note given an id',() => {
      let deleteId;
      let dbLength;
      return Note.findOne()
        .then((res) => {
          deleteId = res.id;
          //grab the current length and delete one.
          const dbPromise = Note.find();
          const apiPromise= chai.request(app).delete(`/v3/notes/${deleteId}`);

          return Promise.all([dbPromise,apiPromise]);
        })
        .then(([data,res]) => {
          dbLength = data.length;
          expect(res).to.have.status(204);
          return Note.find();

        })
        .then((res) => {
          expect(res.body).to.not.equal(dbLength);
        });

    });
  });


});
