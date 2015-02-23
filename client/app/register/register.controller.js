'use strict';

angular.module('voiceVsYouApp')
  .controller('RegisterCtrl', ['$scope','$interval','FftService',function ($scope,$interval, FftService) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    $scope.Data = [{"key": "Sound","values":[]}];
    $scope.fftAmplitude = [{"key": "Amplitude","values":[]}];
    $scope.fftPhase = [{"key": "Phase","values":[]}];
    $scope.DataReconstruct = [{"key": "Reconstruct","values":[]}];
    $scope.MFCC =  [{"key": "MFCC","values":[]}];

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

    var drawMFCC = function (data) {

      FftService.algoMFCC(data).then(function(outputData) {

        $scope.MFCC = [];
        console.log(outputData.length)
        for(var k=0; k< outputData.length;k++) {
          $scope.MFCC.push({"key": "MFCC num" + k,"values":[]});
          $scope.MFCC[k]["values"] = outputData[k].slice(1,outputData[k].length/2+1);
        }

      });
    };

    $scope.jsAudio = FftService.initRecorder();
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

            indexStartData += lengthDataPrec;
            lengthDataPrec = 0;
          }

        },indexStartData);
      }, 400);

     // FftService.draw($scope.Data[0]["values"]);


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
        $scope.jsAudio.Recorder.stop();

        FftService.filtreFreq(sound[0],300,3400).then(function(output) {
          var res = [];
          res.push(output);
          res.push(output);

          $scope.jsAudio.Recorder.exporDataWAV(function(blop) {
            FftService.download(blop);

            $scope.jsAudio.Recorder.exporDataWAV(function(blop) {
              FftService.download(blop);
            },sound);

          },res);

          console.log("nb data: " + output.length);

          var signal = output; //sound[0]

          FftService.cutSignal(signal).then(function (outputData) {
            $scope.DataReconstruct = [];
            $scope.Data[0]["values"] = [];

            // show cut signal
            for (var i = 0; i < outputData.length; i++ ) {
              $scope.DataReconstruct.push({"key": "Sub Sound" + i, "values": []});
              for(var k =0; k < outputData[i].length;k+=128) {
                $scope.DataReconstruct[i]["values"].push(outputData[i][k]);
              }
            }

            console.log(outputData[0]);
            drawMFCC(outputData[0]);

            //show all curve
            for(var k = 0;  k < sound[0].length;k += 128) {
              $scope.Data[0]["values"].push([k,sound[0][k]]);
            }

          });



          //$scope.jsAudio.stopRecording('saveAndDownload');
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
