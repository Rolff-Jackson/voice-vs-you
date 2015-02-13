'use strict';

angular.module('voiceVsYouApp')
  .factory('FftService', function ($q) {

    var worker = new Worker('components/workers/fftWorker.js');
    var defer;

    worker.addEventListener('message', function(e) {
      // traitements additionnels ...
      defer.resolve(e.data);
    }, false);

    return {
      traitementFFT : function(data,incr){
        defer = $q.defer();

        worker.postMessage({
          'command':"traitementFFT",
          'data': data,
          'incr':incr
        });
        return defer.promise;
      },
      cutSignal : function(data){
        defer = $q.defer();

        worker.postMessage({
          'command':"cutSignal",
          'data': data
        });
        return defer.promise;
      }
    };

  });
