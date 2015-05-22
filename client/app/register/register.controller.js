'use strict';

angular.module('voiceVsYouApp')
  .controller('RegisterCtrl',
    ['$scope','$interval','$http','socket', 'MicrophoneService','dtw','Analyse',function ($scope,$interval,$http,socket,MicrophoneService,dtw,Analyse) {

    $scope.Data = [{"key": "Sound","values":[]}];
    $scope.DataReconstruct = [{"key": "Reconstruct","values":[]}];

    $scope.MFCC =  [{"key": "MFCC","values":[]}];
    $scope.colors = [];

    $scope.disable = true;
    $scope.id = {};

    $scope.undisable = function() {
      if ( angular.isDefined($scope.id.username) ) {
        $scope.disable = false;
      }
      else {
        $scope.disable = true;
      }
    }

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
        $scope.colors = Color["MFCC"];

        $scope.deltaColor = Color["delta"];
        $scope.deltadelta = Color["delta-delta"];
        interval = Color["interval"];

        var username = $scope.id.username;
        var points = concatMFCC(AllMFCC);

        //baryRef,points,nbClass,dimension,valMax,maxError
        var start = new Date();

        $http.get('/api/barycentres/' + username).success(function(info) {
          Analyse.k_mean(info,points,20,2,1).then(function(elt) {
            console.log("Time k_mean: " + new Date() - start);
            if ( info.length > 0 ) {
              $http.delete('/api/barycentres/' + info[0]._id);
            }
            $http.post('api/barycentres',{ name: $scope.id.username ,barycentre: elt.bary,sizeClass: elt.sizeClass });
          });
        });
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

    $http.get('/api/barycentres').success(function(awesomeThings) {
      $scope.awesomeThings = awesomeThings;
      socket.syncUpdates('barycentres', $scope.awesomeThings);
    });

  }]);
