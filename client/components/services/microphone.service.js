/**
 * Created by mazurkiewicz on 28/02/15.
 */

'use strict';

angular.module('voiceVsYouApp')
  .factory('MicrophoneService', ['$q','$interval','FftService','DrawService',function ($q,$interval,FftService,DrawService) {

    var jsAudioRecorder;
    var boucle = undefined;

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

    function drawMicrophone(drawData) {
      jsAudioRecorder.startRecording();

      var indexStartData = 0;
      var lengthDataPrec = 0;

      var MINSIZEANALYZE = 16000;
      var MAXSHOW = 45960;

      // Don't start a new fight if we are already fighting/

      var dataS = [];

      boucle = $interval(function() {

        // modification de la lib RecorderJs pour recuperer juste une portion du flux total
        jsAudioRecorder.Recorder.getBufferSub(function(sound) {

          dataS = sound[0];

          // sound stereo with microphone
          var j = 0;
          for(j = lengthDataPrec; j < dataS.length;j = j + 128) {
            if ( indexStartData > MAXSHOW) {
              drawData.splice(0,1);
            }
            drawData.push([j+indexStartData,dataS[j]]);
          }

          lengthDataPrec = j;

          if ( lengthDataPrec > MINSIZEANALYZE ) {
            indexStartData += lengthDataPrec;
            lengthDataPrec = 0;
          }

        },indexStartData);
      }, 400);
    }

    function stopDraw(callback) {

      var signalTot = [];
      var MFCC = [];
      var Color = [];
      var cutData = [];

      if (angular.isDefined(boucle)) {
        $interval.cancel(boucle);
        boucle = undefined;
      }

      jsAudioRecorder.Recorder.getBuffer(function(sound) {
        jsAudioRecorder.Recorder.stop();

        var start  = new Date();
        FftService.filtreFreq(sound[0],300,3400).then(function(signalFiltre) {
          var res = [];
          res.push(signalFiltre);
          res.push(signalFiltre);

          jsAudioRecorder.Recorder.exporDataWAV(function(blop) {
            download(blop);

            jsAudioRecorder.Recorder.exporDataWAV(function(blop) {
              download(blop);
            },sound);

          },res);

          var signal = signalFiltre; //sound[0]

          var endFiltre = new Date();
          console.log("Time filtre: " + (endFiltre-start) );

          FftService.cutSignal(signal).then(function (outputData) {

            cutData = DrawService.drawCut(outputData);

            //for(var k=0; k < outputData.length;k++) {

            var endCut = new Date();
            console.log("Time algo cutSignal : " + (endCut-endFiltre) );
            FftService.algoMFCC(outputData).then(function(coeffsMFCC) {

              var infoMFCC = [{"MFCC": [],"color": [{"data":[],"interval":0}]}];

              if ( coeffsMFCC.length > 0 ) {
                infoMFCC = DrawService.drawMFCC(coeffsMFCC);
              }

              //show all curve
              for(var k = 0;  k < sound[0].length;k += 128) {
                signalTot.push([k,sound[0][k]]);
              }

              console.log("Time algo MFCC : " + (new Date()-endCut) );
              console.log("All Time: " + (new Date()-start) );

              callback(cutData,signalTot,infoMFCC["MFCC"],infoMFCC["color"])
            });


          });
          //$scope.jsAudio.stopRecording('saveAndDownload');
        });
      });
    }

    return {
      initRecorder : function() {
        return initRecorder();
      },
      download: function(blop) {
        return download(blop);
      },
      drawMicrophone: function(dataDraw) {
        return drawMicrophone(dataDraw);
      },
      stopDraw: function(callback) {
        return stopDraw(callback);
      }
    }
  }]);


