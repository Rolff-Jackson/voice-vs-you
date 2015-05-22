'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var BarycentreSchema = new Schema({
  name: String,
  barycentre: Array,
  sizeClass: Array
});

BarycentreSchema.statics.findByName = function (name, cb) {
  return this.find({ name: new RegExp(name, 'i') }, cb);
}

module.exports = mongoose.model('Barycentre', BarycentreSchema);
