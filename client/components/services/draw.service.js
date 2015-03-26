/**
 * Created by mazurkiewicz on 28/02/15.
 */

'use strict';

angular.module('voiceVsYouApp')
  .factory('DrawService', ['FftService', function (FftService) {

    function rgbToHex(r, g, b) {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    function calculIntervalRepartition(infoStat) {
      var moy = infoStat["moy"];
      var min = infoStat["min"];
      var max = infoStat["max"];
      var ecartType = infoStat["ecartType"];

      var interval = [];
      interval.push({"d": min,"f":((moy+min)/2)});
      interval.push({"d": (moy+min)/2,"f":moy});
      interval.push({"d": moy,"f":((2*moy+ecartType)/2)});
      interval.push({"d": (2*moy+ecartType)/2,"f":(moy+ecartType)});
      interval.push({"d": moy+ecartType,"f":(max+moy+ecartType)/2});
      interval.push({"d": (max+moy+ecartType)/2,"f":max});

      return interval;
    }

    function convertionInterval(color,interval,i) {
      return 255*(color-interval[i]["d"])/(interval[i]["f"] - interval[i]["d"]);
    }

    function algoRepartitionCouleur(color,interval) {
      var r =0, g = 0, b= 0;
      var convertionColor = 0;

      if ( color < interval[0]["f"] ) {
        convertionColor = convertionInterval(color,interval,0);
        b = convertionColor;
      }
      else if ( color < interval[1]["f"] ) {
        convertionColor = convertionInterval(color,interval,1);
        g = convertionColor;
        b = 255;
      }
      else if ( color < interval[2]["f"] ) {
        convertionColor = convertionInterval(color,interval,2);
        g = 255;
        b = 255 - convertionColor;
      }
      else if ( color < interval[3]["f"] ) {
        convertionColor = convertionInterval(color,interval,3);
        r = convertionColor;
        g = 255;
      }
      else if ( color < interval[4]["f"] ) {
        convertionColor = convertionInterval(color,interval,4);
        convertionColor = (255-140) *(convertionColor/255);
        r = 255;
        g = 255 - convertionColor;
      }
      else {
        convertionColor = convertionInterval(color,interval,5);
        convertionColor = convertionColor;
        if ( convertionColor <= 160 ) {
          r = 255;
          g = 160 - convertionColor;
        }
        else {
          r = 255 - (convertionColor - 160);
        }
      }

      return rgbToHex(r,g,b);
    }

    function drawImage(datas) {
      var colors = [];

      var N = datas[0].length;
      var max = datas[0][0];
      var min = datas[0][0];

      if ( max.length > 1 ) {
        max = max[1];
        min = min[1];
      }

      var moyenne = 0;
      var variance = 0;
      var nbCoeff = 0;

      for(var l = 0; l < N;l++) {
        colors.push([]);
        for(var k = 0; k < datas.length;k++) {
          var coeffs = datas[k];
          var data = 0;

          if ( datas[k][l].length > 1 ) {
            data = datas[k][l][1];
          }
          else {
            data = datas[k][l];
          }


          moyenne += data;
          variance += data * data;
          nbCoeff++;

          if ( data > max ) { max = data};
          if ( data < min ) { min = data};
          colors[l].push([]);
        }
      }

      moyenne /= nbCoeff;
      variance /= nbCoeff;
      variance -= (moyenne*moyenne);
      var ecartType = Math.sqrt(variance);

      var interval = calculIntervalRepartition({"moy":moyenne,"ecartType":ecartType,"min":min,"max":max});

      for(var k =0; k < datas.length;k++) {
        var coeffs =  datas[k];

        for(var l =0; l < coeffs.length;l++) {

          var data = 0;

          if ( datas[k][l].length > 1 ) {
            data = datas[k][l][1];
          }
          else {
            data = datas[k][l];
          }

          var hexColor = algoRepartitionCouleur(data,interval);
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
      var interval = 0;
      var tmp = [];
      for(var k=0; k< data.length;k++) {
        MFCC.push({"key": "MFCC num" + k,"values":[]});
        data[k] = data[k].slice(1,13);
        MFCC[k]["values"] = data[k];
      }

      var colorMFCC = drawImage(data);

      var deltaMFCC = coeffDelta(data);
      var colorDelta = drawImage(deltaMFCC);

      var delta_deltaMFCC = coeffDelta(deltaMFCC);
      var colorDeltaDelta = drawImage(delta_deltaMFCC);

      if ( colorMFCC.length > 0 ) {
        interval = (colorMFCC.length/10);
        var largeur = Math.floor(interval/5);
        if ( interval%5 > 0 ) {
          interval = Math.floor(5*(largeur+1));
        }
        else {
          interval = 5*largeur;
        }
      }

      var colorCoeff = {"MFCC": colorMFCC,"delta":colorDelta,"delta-delta":colorDeltaDelta,"interval": interval};

      return {"MFCC": MFCC,"color":colorCoeff}
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

