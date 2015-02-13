'use strict';

angular.module('voiceVsYouApp')
  .controller('RegisterCtrl', ['$scope','$interval','FftService',function ($scope,$interval, FftService) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    $scope.Data = [{"key": "Sound","values":[[0,0],[1,0],[0,0],[1,0]]}];
    $scope.fftAmplitude = [{"key": "Amplitude","values":[]}];
    $scope.fftPhase = [{"key": "Phase","values":[]}];
    $scope.DataReconstruct = [{"key": "Reconstruct","values":[]}];

    var truncate = function(val,num) {
      var coeffMult = Math.pow(10,num);
      var tronc = Math.round( coeffMult * val);
      return tronc / coeffMult;
    };

    $scope.xAxisTickFormatSignal = function(){
      return function(d){
        //return d3.time.format('%x')(new Date(d));  //uncomment for date format
        var res = truncate(d/45056,2);
        return res;
      }
    };

    $scope.yAxisTickFormatFunction = function(){
      return function(d){
        return truncate(d,2);
      }
    };

    $scope.xAxisTickFormat = function() {
      return function (d){
        var res = truncate(d,2);
        return res;
      }
    }

    $scope.readData = function() {

    };

    $scope.stopRead = function() {

    };

    var drawFFT = function (data) {

      $scope.fftAmplitude =  [{"key": "Amplitude","values":[]}];
      $scope.fftPhase = [{"key": "Phase","values":[]}];
      $scope.DataReconstruct = [{"key": "Reconstruct","values":[]}];

      FftService.traitementFFT(data,128).then(function(outputData) {
        $scope.fftAmplitude[0]["values"] = outputData["info"]["amplitude"];
        $scope.fftPhase[0]["values"] = outputData["info"]["phase"];

        $scope.DataReconstruct[0]["values"] = outputData["reverse"];

      });
    }

    /***************************************************
     Detect browser
     ***************************************************/
    if((window.chrome !== null) && (window.navigator.vendor === "Google Inc.")) {
    } else {
      alert('This application will only work on Google Chrome, Firefox and Opera!');
    }
    var jsAudioRecorder = new jsHtml5AudioRecorder();
    /***************************************************
     Init Html5 Audio Streaming
     ***************************************************/

    jsAudioRecorder.Recorder = Recorder; //External library that effectively record audio stream
    jsAudioRecorder.mediaPath = '/'; //Path where to store audio files
    jsAudioRecorder.audioExtension = 'wav'; //Only wav format is supported
    jsAudioRecorder.audioTagId = 'myAudio';
    jsAudioRecorder.showStreamOnFinish = false; //Show audio player on finish?
    jsAudioRecorder.phpFile = 'bower_components/js-html5-audio-recorder/demo/form/audioProcess.php'; //Php file that will proceed to audio file
    jsAudioRecorder.init();

    $scope.jsAudio = jsAudioRecorder;
    $scope.stop = undefined;

    $scope.startRecordingData = function() {
      var data = [];

      $scope.clearData();
      $scope.jsAudio.startRecording();

      var indexStartData = 0;
      var lengthDataPrec = 0;

      var MINSIZEANALYZE = 16000;
      var MAXSHOW = 45960;

      // Don't start a new fight if we are already fighting/

      var dataS = [];
      $scope.stop = $interval(function() {

        // modification de la lib RecorderJs pour recuperer juste une portion du flux total
        $scope.jsAudio.Recorder.getBufferSub(function(sound) {

          dataS = sound[0];

          // sound stereo with microphone
          var j = 0;
          for(j = lengthDataPrec; j < dataS.length;j = j + 128) {

            if ( indexStartData > MAXSHOW) {
              $scope.Data[0]["values"].splice(0,1);
            }

            $scope.Data[0]["values"].push([j+indexStartData,dataS[j]]);
          }

          lengthDataPrec = j;

          if ( lengthDataPrec > MINSIZEANALYZE ) {

            //drawFFT(dataS);
            indexStartData += lengthDataPrec;
            lengthDataPrec = 0;
          }

        },indexStartData);

      }, 400);
    };

    /**
     * You can use "save", "saveAndDownload" or "saveAndStream", "downloadAndStream" parameters
     */

    $scope.stopRecordingData = function() {

      if (angular.isDefined($scope.stop)) {
        $interval.cancel($scope.stop);
        $scope.stop = undefined;
      }

      $scope.jsAudio.Recorder.getBuffer(function(sound) {

        FftService.cutSignal(sound[0]).then(function (outputData) {
          $scope.DataReconstruct = [];
          $scope.Data[0]["values"] = [];

          for (var i = 0; i < outputData.length; i++) {
            $scope.DataReconstruct.push({"key": "Sub Sound" + i, "values": []});
            $scope.DataReconstruct[i]["values"] = outputData[i];
          }

          for(var k = 0;  k < sound[0].length;k = k + 128) {
            $scope.Data[0]["values"].push([45960*k/sound[0].length,sound[0][k]]);
          }

          $scope.jsAudio.stopRecording('downloadAndStream');
        });
      });

    };

    $scope.saveData = function() {

    };

    $scope.clearData = function() {
      $scope.Data = [{"key": "Sound","values":[]}];
      $scope.fftAmplitude = [{"key": "Amplitude","values":[]}];
      $scope.fftPhase = [{"key": "Phase","values":[]}];
      $scope.DataReconstruct = [{"key": "Reconstruct","values":[]}];
    };

  }]);
