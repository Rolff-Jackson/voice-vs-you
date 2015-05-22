'use strict';
angular.module('voiceVsYouApp')
  .factory('Analyse',function ($q) {

    var worker = new Worker('components/workers/analyseWorker.js');
    var defer;

    worker.addEventListener('message', function(e) {
      // traitements additionnels ...
      defer.resolve(e.data);
    }, false);

    return {
      k_mean : function(info,points,nbClass,valMax,maxError){
        defer = $q.defer();

        worker.postMessage({
          'command':"k_mean",
          'info': info,
          'points':points,
          'nbClass':nbClass,
          'valMax':valMax,
          'maxError':maxError
        });
        return defer.promise;
      },
      minDistance : function(points,barycentres,sizeClass){
        defer = $q.defer();

        worker.postMessage({
          'command':"minDistance",
          'points': points,
          'barycentres': barycentres,
          'sizeClass':sizeClass
        });
        return defer.promise;
      },
      bestVoice : function(allInfo,points){
        defer = $q.defer();

        worker.postMessage({
          'command':"bestVoice",
          'allInfo': allInfo,
          'points': points
        });
        return defer.promise;
      }
    }
  });
