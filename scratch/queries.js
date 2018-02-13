'use strict';
//
// const mongoose = require('mongoose');
// mongoose.Promise = global.Promise;
// const { MONGODB_URI } = require('../config');
//
// const Note = require('../models/note');
//
// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     const searchTerm = 'lady gaga';
//     let filter = {};
//
//     if (searchTerm) {
//       const re = new RegExp(searchTerm, 'i');
//       filter.title = { $regex: re };
//     }
//     return Note.findById('filter')
//       .select('title created')
//       .sort('created')
//       .then(results => {
//         console.log(results);
//       })
//       .catch(console.error);
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


//===CHALLANGE !
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const term = ''
const { MONGODB_URI } = require('../config');
const Note = require('../models/note');
let filter = {}
//{ $text: { $search: 'velit' } }
if(term.length>0){
  filter = {$text:{$search:term}}
}
mongoose.connect(MONGODB_URI)

  .then(() => Note.createIndexes())
  .then(() => {
    return Note.find(filter)
      .then(results => {
        console.log(results);
      });
  })
  .then(() => {
    return mongoose.disconnect()
      .then(() => {
        console.info('Disconnected');
      });
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });
