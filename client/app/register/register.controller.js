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

        drawTable();

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

          console.log(output);

          $scope.jsAudio.Recorder.exporDataWAV(function(blop) {
            FftService.download(blop);

            $scope.jsAudio.Recorder.exporDataWAV(function(blop) {
              FftService.download(blop);
            },sound);

          },res);

          console.log("nb data: " + output.length);

          var signal = output; //sound[0]

          FftService.cutSignal(signal).then(function (outputData) {
            console.log(outputData.length);
            $scope.DataReconstruct = [];
            $scope.Data[0]["values"] = [];

            // show cut signal
            for (var i = 0; i < outputData.length; i++ ) {
              $scope.DataReconstruct.push({"key": "Sub Sound" + i, "values": []});
              for(var k =0; k < outputData[i].length;k+=128) {
                $scope.DataReconstruct[i]["values"].push(outputData[i][k]);
              }
            }

            for(var k=0; k < outputData.length;k++) {
              drawMFCC(outputData[k]);
            }

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

    function rgbToHex(r, g, b) {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    function drawTable() {
      var colors = [];
      var N = $scope.MFCC[0]["values"].length;

      var max = $scope.MFCC[0]["values"][0][1];
      var min = $scope.MFCC[0]["values"][0][1];

      for(var l = 0; l < N;l++) {
        colors.push([]);
        for(var k = 0; k < $scope.MFCC.length;k++) {
          var coeffs = $scope.MFCC[k]["values"];
          if ( coeffs[l][1] > max ) { max = coeffs[l][1]};
          if ( coeffs[l][1] < min ) { min = coeffs[l][1]};
          colors[l].push([]);
        }
      }

      for(var k =0; k < $scope.MFCC.length;k++) {
        var coeffs = $scope.MFCC[k]["values"];

        for(var l =0; l < coeffs.length;l++) {
          var color = Math.floor( (Math.pow(256,3) - 1) * ( coeffs[l][1] - min )/(max-min));
          var r = Math.floor(color/256/256);
          var g = Math.floor(color/256)%265
          var b = color%256;
          var hexColor = rgbToHex(r,g,b);
          colors[l][k]={color:hexColor};
        }
      }

      $scope.colors = colors;
    }
    $scope.colors = [];

  }]);
