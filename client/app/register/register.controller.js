'use strict';

angular.module('voiceVsYouApp')
  .controller('RegisterCtrl', ['$scope','$interval','MicrophoneService',function ($scope,$interval,MicrophoneService) {

    $scope.Data = [{"key": "Sound","values":[]}];
    $scope.DataReconstruct = [{"key": "Reconstruct","values":[]}];

    $scope.MFCC =  [{"key": "MFCC","values":[]}];
    $scope.colors = [];

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
    };

    MicrophoneService.initRecorder();

    $scope.startRecordingData = function() {
      $scope.clearData();
      MicrophoneService.drawMicrophone($scope.Data[0]["values"]);
    };

    $scope.stopRecordingData = function() {
      MicrophoneService.stopDraw(function(cutData,signalTot,MFCC,Color) {
        $scope.DataReconstruct = cutData;
        $scope.Data[0]["values"] = signalTot;
        $scope.MFCC = MFCC;
        $scope.colors = Color;
      });
    };

    $scope.clearData = function() {
      $scope.Data = [{"key": "Sound","values":[]}];
      $scope.DataReconstruct = [{"key": "Reconstruct","values":[]}];
    };

  }]);
