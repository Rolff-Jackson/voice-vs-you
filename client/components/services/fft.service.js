'use strict';

angular.module('voiceVsYouApp')
  .factory('FftService', function ($q,$interval) {

    var worker = new Worker('components/workers/fftWorker.js');
    var worker2 = new Worker('components/workers/worker.js');
    var worker3 = new Worker('components/workers/worker.js');
    var defer,defer2,defer3;
    var jsAudioRecorder;

    worker.addEventListener('message', function(e) {
      // traitements additionnels ...
      defer.resolve(e.data);
    }, false);

    worker2.addEventListener('message', function(e) {
      // traitements additionnels ...
      defer2.resolve(e.data);
    }, false);

    worker3.addEventListener('message', function(e) {
      // traitements additionnels ...
      defer3.resolve(e.data);
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
      initRecorder : function() {
        return initRecorder();
      },
      test1: function() {
        defer2 = $q.defer();

        worker2.postMessage({
          'command':"test1"
        });
        return defer2.promise;
      },
      test2: function() {
        defer3 = $q.defer();

        worker3.postMessage({
          'command':"test2"
        });
        return defer3.promise;
      },
      drawData: function(dataDraw,dataMicro,indices) {
        defer2 = $q.defer();

        worker2.postMessage({
          'command':"drawData",
          'dataDraw' : dataDraw,
          'dataMicro' : dataMicro,
          'indices' : indices
        });
        return defer2.promise;
      },
      algoMFCC: function(dataMicro) {
        defer = $q.defer();

        worker.postMessage({
          'command':"algoMFCC",
          'dataMicro' : dataMicro
        });
        return defer.promise;
      }

    };

    function initRecorder() {
      /***************************************************
       Detect browser
       ***************************************************/
      if((window.chrome !== null) && (window.navigator.vendor === "Google Inc.")) {
      } else {
        alert('This application will only work on Google Chrome, Firefox and Opera!');
      }
      jsAudioRecorder = new jsHtml5AudioRecorder();
      /***************************************************
       Init Html5 Audio Streaming
       ***************************************************/

      jsAudioRecorder.Recorder = Recorder; //External library that effectively record audio stream
      jsAudioRecorder.mediaPath = '/'; //Path where to store audio files
      jsAudioRecorder.audioExtension = 'wav'; //Only wav format is supported
      jsAudioRecorder.audioTagId = 'myAudio';
      jsAudioRecorder.showStreamOnFinish = false; //Show audio player on finish?
      jsAudioRecorder.phpFile = ''; //Php file that will proceed to audio file
      jsAudioRecorder.init();

      return jsAudioRecorder;
    };



  });
