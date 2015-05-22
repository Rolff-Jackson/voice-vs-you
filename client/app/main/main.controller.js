'use strict';

angular.module('voiceVsYouApp')
  .controller('MainCtrl', ['$scope','$http','$location','socket','Analyse' ,function ($scope, $http,$location, socket,Analyse) {
    $scope.awesomeThings = [];

    $scope.changeView = function(view){
      $location.path(view); // path not hash
    }

    $scope.audio;
    $scope.read = function() {

      if (!$scope.audio.playing) {
        $scope.audio.play();
        $scope.audio.volume(1);
      }
    }

    $scope.pause = function() {
      if ($scope.audio.playing) {
        $scope.audio.pause();
        $scope.audio.volume(0);
        console.log($scope.audio.position, $scope.audio.duration, $scope.audio.load_percent, $scope.audio.volume());
      }
    }

    $scope.stop = function () {
      $scope.audio.seek(0);
    }

    var initAudio = function () {
      var audio5js = new Audio5js({
        swf_path: '/statics/swf/audio5js.swf',
        throw_errors: true,
        format_time: true,
        ready: function(player) {
          this.load('/assets/song.mp3');
        }
      });
      return audio5js;
    }

    var points = [];
    points.push([-1,1]);
    points.push([-1,0]);
    points.push([-5,-6]);
    points.push([6,5]);
    points.push([8,6]);
    points.push([1,2]);
    //points,nbClass,dimension,valMax,maxError
    var info = Analyse.k_mean([],points,3,10,1).then(function(info){
      console.log(info);
      Analyse.minDistance(points,info.bary,info.sizeClass).then(function(res){
        console.log("Min: " + res);
      })
    });

    $scope.audio = initAudio();

  }]);
