'use strict';
const app = require('../server');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI, JWT_SECRET } = require('../config');

//chai stuff
const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiSpies = require('chai-spies');
const expect = chai.expect;
chai.use(chaiHttp);
chai.use(chaiSpies);

//models and seed data
const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');
const User = require('../models/user');
const seedNotes = require('../db/seed/notes.json');
const seedFolders = require('../db/seed/folders');
const seedTags = require('../db/seed/tags.json');



//fake user
let token;
let id;
const _id = '555555555555555555550001';
const username = 'exampleUser';
const password = 'examplePass';
const fullname = 'Example User';


describe('Noteful, Notes Test',function(){

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI, { autoIndex: false });
  });

  beforeEach(function () {
    const notePromise = Note.insertMany(seedNotes);
    const folderPromise = Folder.insertMany(seedFolders);
    const tagPromise = Tag.insertMany(seedTags);

    return Promise.all([notePromise,folderPromise,tagPromise])

      .then(() => {
        Note.ensureIndexes();
        Folder.ensureIndexes();

      })
      .then(()=>{
        return User.hashPassword(password);
      })
      .then((digest) => {
        return User.create({ _id,username, password: digest, fullname });
      })
      .then(user => {
        id = user.id;
        token = jwt.sign({ user }, JWT_SECRET, { subject: user.username});
      });
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
      const apiPromise = chai.request(app).get('/v3/notes').set('Authorization', `Bearer ${token}`);
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
          return chai.request(app).get(`/v3/notes/${data.id}`).set('Authorization', `Bearer ${token}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id','title','content','folderId','tags');

          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
        });
    });

  });

  describe('POST /v3/notes', function(){
    it('Return 201 and the response should equal the note we create',() => {
      const newTestNote={
        'title':'This is a test',
        'content':'This is content for the test',
        'userId':id,
        'tags':[ '222222222222222222222200']
      };
      let body;

      return chai.request(app).post('/v3/notes/').set('Authorization', `Bearer ${token}`)
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

  describe('PUT /V3/notes/:id',() => {
    it('should update a note given a proper id',() => {

      let updateNote;
      let oldTitle;
      return Note.findOne()
        .then((res) => {
          oldTitle = res.title;
          updateNote = res;
          updateNote.title = 'New title';
          updateNote.content = 'New content';


          return chai.request(app).put(`/v3/notes/${updateNote.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateNote);
        })
        .then((res) => {
          expect(res.body).to.be.a('object');
          expect(res.body.title).to.not.equal(oldTitle);

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
          //grab the current length and then delete one.
          const dbPromise = Note.find();
          const apiPromise= chai.request(app).delete(`/v3/notes/${deleteId}`).set('Authorization', `Bearer ${token}`);

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
