'use strict';

angular.module('voiceVsYouApp')
  .controller('MainCtrl', function ($scope, $http,$location, socket) {
    $scope.awesomeThings = [];

    $http.get('/api/things').success(function(awesomeThings) {
      $scope.awesomeThings = awesomeThings;
      socket.syncUpdates('thing', $scope.awesomeThings);
    });

    $scope.addThing = function() {
      if($scope.newThing === '') {
        return;
      }
      $http.post('/api/things', { name: $scope.newThing });
      $scope.newThing = '';
    };

    $scope.deleteThing = function(thing) {
      $http.delete('/api/things/' + thing._id);
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('thing');
    });

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

    $scope.audio = initAudio();


  });
