/**
 * Created by Florian on 26/03/2015.
 */
'use strict';
angular.module('voiceVsYouApp')
  .factory('dtw', ['FftService', 'DrawService',function (FftService,DrawService) {

    function distanceVecteurs(A, B) {
      var distance = 0;
      for (var i = 0; i < A.length; i++) {
        distance += (A[i] - B[i])(A[i] - B[i]);
      }
      return Math.sqrt(distance);
    }

    function initdistance(A) {
      var DTW = [];
      for (var i = 0; i < A[0].length; i++) {
        DTW[i][0] = 0;
      }
      for (var i = 0; i < A[1].length; i++) {
        DTW[0][j] = 0;
      }
      return DTW;
    }

    function mini2(a, b) {
      if (a < b) {
        return a;
      }
      else return b;
    }

    function mini3(a, b, c) {
      return mini2(a, mini2(b, c));
    }

    function distanceCumulee(A, B) {
      var distance = 0;
      var DTW = initdistance(A);
      for (var i = 1; i < A[0].length; i++) {
        for (var j = 1; j < A[1].length; j++) {
          var cout = Math.sqrt(Math.pow(distanceVecteurs(A[i][0], B[j][0], 2)) + Math.pow(distanceVecteurs(A[i][1], B[j][1], 2)));
          DTW[i][j] = cout + mini3(DTW[i - 1][j], DTW[i][j - 1], DTW[i - 1][j - 1]);
        }
      }
      return DTW;
    }
  }])
