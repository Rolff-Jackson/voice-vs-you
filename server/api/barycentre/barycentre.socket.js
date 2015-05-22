/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var barycentre = require('./barycentre.model');

exports.register = function(socket) {
  barycentre.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  barycentre.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('barycentre:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('barycentre:remove', doc);
}
