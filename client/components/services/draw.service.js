/**
 * Created by mazurkiewicz on 28/02/15.
 */

'use strict';

angular.module('voiceVsYouApp')
  .factory('DrawService', ['FftService', function (FftService) {

    function rgbToHex(r, g, b) {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    function drawTable(datas) {
      var colors = [];

      var N = datas[0]["values"].length;
      var max = datas[0]["values"][0][1];
      var min = datas[0]["values"][0][1];

      for(var l = 0; l < N;l++) {
        colors.push([]);
        for(var k = 0; k < datas.length;k++) {
          var coeffs = datas[k]["values"];
          if ( coeffs[l][1] > max ) { max = coeffs[l][1]};
          if ( coeffs[l][1] < min ) { min = coeffs[l][1]};
          colors[l].push([]);
        }
      }

      for(var k =0; k < datas.length;k++) {
        var coeffs = datas[k]["values"];

        for(var l =0; l < coeffs.length;l++) {
          var color = Math.floor( (Math.pow(256,3) - 1) * ( coeffs[l][1] - min )/(max-min));
          var r = Math.floor(color/256/256);
          var g = Math.floor(color/256)%265
          var b = color%256;
          var hexColor = rgbToHex(r,g,b);
          colors[l][k]={color:hexColor};
        }
      }

      return colors;
    }

    function drawCut(outputData) {
      // show cut signal
      var cutData = [];
      for (var i = 0; i < outputData.length; i++ ) {
        cutData.push({"key": "Sub Sound" + i, "values": []});

        for(var k =0; k < outputData[i].length;k+=128) {
          cutData[i]["values"].push(outputData[i][k]);
        }
      }
      return cutData;
    }

    function drawMFCC(data) {
      var MFCC = [];

      for(var k=0; k< data.length;k++) {
        MFCC.push({"key": "MFCC num" + k,"values":[]});
        MFCC[k]["values"] = data[k].slice(1,data[k].length/2+1);
      }

      var colorMFCC = drawTable(MFCC);

      return {"MFCC": MFCC,"color":colorMFCC}
    };

    return {
      drawCut: function(outputData) {
        return drawCut(outputData);
      },
      drawMFCC: function(data,MFCC,colorMFCC) {
        return drawMFCC(data,MFCC,colorMFCC);
      }

    }

  }]);

