'use strict';
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const { MONGODB_URI } = require('../config');

const Note = require('../models/note');
const Folder = require('../models/folder');

const seedNotes = require('../db/seed/notesMlab');
const seedFolders = require('../db/seed/folders');

// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     return mongoose.connection.db.dropDatabase()
//       .then(result => {
//         console.info(`Dropped Database: ${result}`);
//       });
//   })
//   .then(() => {
//     return Note.insertMany(seedNotes)
//       .then(results => {
//         console.info(`Inserted ${results.length} Notes`);
//       })
//       .then(() => Note.createIndexes());
//   })
//   .then(() => {
//     return Folder.insertMany(seedFolders)
//       .then((results) => {
//         console.info(`Inserted ${results.length} Folders`);
//       });
//   })
//   .then(() => {
//     return mongoose.disconnect()
//       .then(() => {
//         console.info('Disconnected');
//       });
//   })
//   .catch(err => {
//     console.error(`ERROR: ${err.message}`);
//     console.error(err);
//   });


mongoose.connect(MONGODB_URI)
  .then(() => mongoose.connection.db.dropDatabase())
  .then(() => Folder.insertMany(seedFolders))
  .then(() => Note.insertMany(seedNotes))
  .then(() => Note.createIndexes())
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });
