/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /things              ->  index
 * POST    /things              ->  create
 * GET     /things/:id          ->  show
 * PUT     /things/:id          ->  update
 * DELETE  /things/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var Barycentre = require('./barycentre.model');

// Get list of things
exports.index = function(req, res) {
  Barycentre.find(function (err, things) {
    if(err) { return handleError(res, err); }
    return res.json(200, things);
  });
};

// Get a single thing
exports.show = function(req, res) {
  Barycentre.findByName(req.params.id, function (err, barycentre) {
    if(err) { return handleError(res, err); }
    if(!barycentre) { return res.send(404); }
    return res.json(barycentre);
  });
};

// Creates a new thing in the DB.
exports.create = function(req, res) {
  Barycentre.create(req.body, function(err, barycentre) {
    if(err) { return handleError(res, err); }
    return res.json(201, barycentre);
  });
};

// Updates an existing thing in the DB.
exports.update = function(req, res) {
  //if(req.body._id) { delete req.body._id; }
  Barycentre.findById(req.params.id, function (err, barycentre) {
    if (err) { return handleError(res, err); }
    if(!barycentre) { return res.send(404); }
    var updated = _.merge(barycentre, req.body);

    updated.save(function (err) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(200, updated);
    });
  });
};

// Deletes a thing from the DB.
exports.destroy = function(req, res) {
  Barycentre.findById(req.params.id, function (err, barycentre) {
    if(err) { return handleError(res, err); }
    if(!barycentre) { return res.send(404); }
    barycentre.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}
