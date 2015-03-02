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
        convertionColor = 140 *(convertionColor/255);
        r = 255;
        g = 160 - convertionColor;
      }

      return rgbToHex(r,g,b);
    }

    function drawImage(datas) {
      var colors = [];

      var N = datas[0]["values"].length;
      var max = datas[0]["values"][0][1];
      var min = datas[0]["values"][0][1];

      var moyenne = 0;
      var variance = 0;
      var nbCoeff = 0;

      for(var l = 0; l < N;l++) {
        colors.push([]);
        for(var k = 0; k < datas.length;k++) {
          var coeffs = datas[k]["values"];

          moyenne += coeffs[l][1];
          variance += coeffs[l][1] * coeffs[l][1];
          nbCoeff++;

          if ( coeffs[l][1] > max ) { max = coeffs[l][1]};
          if ( coeffs[l][1] < min ) { min = coeffs[l][1]};
          colors[l].push([]);
        }
      }

      moyenne /= nbCoeff;
      variance /= nbCoeff;
      variance -= (moyenne*moyenne);
      var ecartType = Math.sqrt(variance);

      console.log("moyenne : " + moyenne);
      console.log("ecart-type : " + Math.sqrt(variance))

      for(var k =0; k < datas.length;k++) {
        var coeffs = datas[k]["values"];

        for(var l =0; l < coeffs.length;l++) {
         // var coeff = ( coeffs[l][1] - min )/(max-min);
          var interval = calculIntervalRepartition({"moy":moyenne,"ecartType":ecartType,"min":min,"max":max});
          var hexColor = algoRepartitionCouleur(coeffs[l][1],interval);

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

      for(var k=0; k< data.length;k++) {
        MFCC.push({"key": "MFCC num" + k,"values":[]});
        MFCC[k]["values"] = data[k].slice(1,data[k].length/2);
      }

      var color = drawImage(MFCC);

      if ( color.length > 0 ) {
        interval = (color.length/10);
        var largeur = Math.floor(interval/5);
        if ( interval%5 > 0 ) {
          interval = Math.floor(5*(largeur+1));
        }
        else {
          interval = 5*largeur;
        }
      }

      var colorMFCC = {"data": color,"interval": interval};

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

