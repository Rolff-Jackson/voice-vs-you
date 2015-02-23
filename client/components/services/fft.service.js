'use strict';

angular.module('voiceVsYouApp')
  .factory('FftService', function ($q,$interval) {

    var worker = new Worker('components/workers/fftWorker.js');

    var defer;
    var jsAudioRecorder;

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
      initRecorder : function() {
        return initRecorder();
      },
      algoMFCC: function(dataMicro) {
        defer = $q.defer();

        worker.postMessage({
          'command':"algoMFCC",
          'dataMicro' : dataMicro
        });
        return defer.promise;
      },
      download: function(blop) {
        download(blop);
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
      jsAudioRecorder.phpFile = '/api/things'; //Php file that will proceed to audio file
      jsAudioRecorder.init();

      return jsAudioRecorder;
    };

    function download(blob) {

      jsAudioRecorder.Recorder.stop();

      var url = window.URL.createObjectURL(blob);
      //Create a link
      var hf = document.createElement('a');

      var temporaryId = new Date().toISOString();

      //Define link attributes
      hf.href = url;
      hf.id = temporaryId;
      hf.download = temporaryId + '.wav';
      hf.innerHTML = hf.download;
      hf.style.display = 'none';
      hf.style.visibility = 'hidden';
      //Append the link inside html code
      document.body.appendChild(hf);

      //Simulate click on link to download file, and instantly delete link
      document.getElementById(hf.id).click();
      document.getElementById(hf.id).remove();

      jsAudioRecorder.Recorder.clear();
      console.log('Stop Recording audio!');
    }



    });
