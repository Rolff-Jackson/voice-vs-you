'use strict';

angular.module('voiceVsYouApp')
  .controller('RegisterCtrl', ['$scope','$interval','MicrophoneService','dtw',function ($scope,$interval,MicrophoneService,dtw) {

    $scope.Data = [{"key": "Sound","values":[]}];
    $scope.DataReconstruct = [{"key": "Reconstruct","values":[]}];

    $scope.MFCC =  [{"key": "MFCC","values":[]}];
    $scope.colors = [];

    var interval = 0;

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

    $scope.tmp1;
    $scope.tmp2;
    $scope.tmp3;

    $scope.stopRecordingData = function() {
      MicrophoneService.stopDraw(function(cutData,signalTot,AllMFCC,Color) {
        $scope.DataReconstruct = cutData;
        $scope.Data[0]["values"] = signalTot;
        $scope.MFCC = AllMFCC["MFCCDraw"];
        $scope.colors = Color["MFCC"];

        $scope.deltaColor = Color["delta"];
        $scope.deltadelta = Color["delta-delta"];
        interval = Color["interval"];

        if ( angular.isDefined($scope.tmp1) ) {

          console.log("D1");
          console.log(dtw.distanceCumulee(AllMFCC["MFCC"],$scope.tmp1));

          console.log("D2");
          console.log(dtw.distanceCumulee(AllMFCC["Delta"],$scope.tmp2));

          console.log("D3");
          console.log(dtw.distanceCumulee(AllMFCC["DeltaDelta"],$scope.tmp3));
        }

        $scope.tmp1 = AllMFCC["MFCC"];
        $scope.tmp2 = AllMFCC["Delta"];
        $scope.tmp3 = AllMFCC["DeltaDelta"];
      });
    };

    $scope.clearData = function() {
      $scope.Data = [{"key": "Sound","values":[]}];
      $scope.DataReconstruct = [{"key": "Reconstruct","values":[]}];
    };


    $scope.echelle = function(id) {
      if ( id%interval == 0 && (id > 0) ) {
        return true;
      }
    }

  }]);
