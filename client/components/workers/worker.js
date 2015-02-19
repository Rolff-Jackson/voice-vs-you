/**
 * Created by mazurkiewicz on 19/02/15.
 */

var MINSIZEANALYZE = 16000;
var MAXSHOW = 45960;

self.addEventListener('message', function(e) {
  switch(e.data.command) {
    case 'test1':

      self.postMessage(
        test1()
      );
      break;

    case 'test2':
      self.postMessage(
        test2()
      );
      break;

    case 'drawData':
      self.postMessage(
        drawData(e.data.dataDraw,e.data.dataMicro,e.data.indices)
      );
      break;
    case 'draw':
      self.postMessage(
        draw(e.data.data)
      );
      break;
  }

}, false);

function test1() {
  return "coucou";
}

function test2() {
  return "salut";
}

function drawData(dataDraw,dataMicrphone,indices) {

   // sound stereo with microphone
  var j = 0;
  console.log(indices);
  for(j = indices[0]; j < dataMicrphone.length;j = j + 128) {

    if ( indices[1] > MAXSHOW) {
      dataDraw.splice(0,1);
    }

    dataDraw.push([j+indices[1],dataMicrphone[j]]);
  }

  indices[0] = j;

  if ( indices[0] > MINSIZEANALYZE ) {

    //drawFFT(dataS,128);
    indices[1] += indices[0];
    indices[0] = 0;
  }

  return [dataDraw,indices];
}


function draw(data) {
  setInterval( function() {
    data.push([50000*data.length,data.length]);
  },400);
}
