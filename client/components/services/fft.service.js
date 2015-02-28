'use strict';

angular.module('voiceVsYouApp')
  .factory('FftService', function ($q,$interval) {

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
      },
      algoMFCC: function(dataMicro) {
        defer = $q.defer();

        worker.postMessage({
          'command':"algoMFCC",
          'dataMicro' : dataMicro
        });
        return defer.promise;
      },
      filtreFreq: function(dataMicro,freqB,freqH) {
        defer = $q.defer();

        worker.postMessage({
          'command':"filtreFreq",
          'dataMicro' : dataMicro,
          'freqB': freqB,
          'freqH': freqH
        });
        return defer.promise;
      }
    };





  });
