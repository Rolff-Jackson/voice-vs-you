'use strict';

angular.module('voiceVsYouApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('research', {
        url: '/research',
        templateUrl: 'app/research/research.html',
        controller: 'ResearchCtrl'
      });
  });
