'use strict';

angular.module('voiceVsYouApp')
  .controller('ResearchCtrl',
    ['$scope','$interval','$http','socket', 'MicrophoneService','dtw','Analyse',function ($scope,$interval,$http,socket,MicrophoneService,dtw,Analyse) {

    $scope.Data = [{"key": "Sound","values":[]}];
    $scope.DataReconstruct = [{"key": "Reconstruct","values":[]}];

    $scope.MFCC =  [{"key": "MFCC","values":[]}];
    $scope.colors = [];

    $scope.who="";
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

    function concatMFCC(allMFCC) {
      var MFCC = allMFCC["MFCC"];
      var delta = allMFCC["MFCC"];
      var deltaDelta = allMFCC["DeltaDelta"];

      var allConcat = [];

      for(var i= 0; i < MFCC.length;i++) {
        allConcat.push(MFCC[i].concat(delta[i]).concat(deltaDelta[i]));
      }

      return allConcat;
    }

    $scope.stopRecordingData = function() {
      MicrophoneService.stopDraw(function(cutData,signalTot,AllMFCC,Color) {
        $scope.DataReconstruct = cutData;
        $scope.Data[0]["values"] = signalTot;
        $scope.MFCC = AllMFCC["MFCCDraw"];

        var points = concatMFCC(AllMFCC);
        var start = new Date();

        //baryRef,points,nbClass,dimension,valMax,maxError
        $http.get('/api/barycentres').success(function(info) {
          Analyse.bestVoice(info,points).then(function(who) {
            console.log("Time bestVoice: " + (new Date() - start) );
            $scope.who="You are " + who;
            console.log(who);
          });
        });
      });
    };

    $scope.clearData = function() {
      $scope.Data = [{"key": "Sound","values":[]}];
      $scope.DataReconstruct = [{"key": "Reconstruct","values":[]}];

      $scope.MFCC = [];
      $scope.colors = [];
    };


    $scope.echelle = function(id) {
      if ( id%interval == 0 && (id > 0) ) {
        return true;
      }
    }

    $http.get('/api/barycentres').success(function(awesomeThings) {
      $scope.awesomeThings = awesomeThings;
      socket.syncUpdates('barycentres', $scope.awesomeThings);
    });

  }]);
