/**
 * Created by Florian on 26/03/2015.
 */
'use strict';
angular.module('voiceVsYouApp')
  .factory('dtw', ['FftService', 'DrawService',function (FftService,DrawService) {

    function data(P) {
      if (P.length > 1 ) {
        return P[1];
      }
      return P;
    }
    function distanceVecteurs(A, B) {
      var distance = 0;

      for (var i = 0; i < A.length; i++) {
        distance += (data(B[i]) - data(A[i]) )*(data(B[i]) - data(A[i]));
      }

      return Math.sqrt(distance);
    }

    function initdistance(n,m) {
      var DTW = new Array(n);

      for (var i = 0; i < n; i++) {
        DTW[i] = new Array(m);
        DTW[i][0] = 0;
      }
      for (var j = 0; j < m; j++) {
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

    // A, B ligne fenetre de Hamming  ; colonne les coeffs MFCC ( A test, B ref )
    // problem n,m matrice algo DTW
    function distanceCumulee(A, B) {
      var n = A.length;

      if (B.length < n ) {
        n = B.length;
      }

      var DTW = initdistance(n,n);

      for (var i = 1; i < n; i++) {
        for (var j = 1; j < n; j++) {

          var cout = distanceVecteurs(A[i],B[j]);
          DTW[i][j] = cout + mini3(DTW[i - 1][j], DTW[i][j - 1], DTW[i - 1][j - 1]);

        }
      }

      return DTW[n-1][n-1];
    }

    return {
      distanceCumulee: function(A,B) {
        return distanceCumulee(A,B);
      }
    }

    // AllMFCC["MFCC"] AllMFCC["Delta"] AllMFCC["DeltaDelta"]
    /*
        console.log(dtw.distanceCumulee(AllMFCC["MFCC"],$scope.tmp1));
    */

  }]);
