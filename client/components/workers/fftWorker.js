/**
 * Created by mazurkiewicz on 11/02/15.
 */

function traitementFFT(data,incr) {

  var N = data.length;
  var nbEltAnalyse = Math.pow(2,Math.floor(Math.log(N)/Math.log(2)));
  var soundData = data.subarray(0,nbEltAnalyse);
  var fftData = fft(soundData,0);

  var fftReverse= [];
  var infoFFT = [];

  if ( fftData != null ) {

    fftReverse = inverseFFT(fftData, incr);
    infoFFT = amplitudePhase(fftData, incr);

  }
  else {
    console.log("Erreur fftData null");
  }

  return {"info": infoFFT, "reverse":fftReverse}
}

self.addEventListener('message', function(e) {
  switch(e.data.command) {
    case 'traitementFFT':
      self.postMessage(
        traitementFFT(e.data.data, e.data.incr)
      );
      break;

    case 'testFFT':
      self.postMessage(
        testFFT()
      );
      break;
    case 'cutSignal':
      self.postMessage(
        signalDetection(e.data.data)
      );
      break;

  }

}, false);


function complexOf(a,b) {
  return {"real":a, "img":b};
}

function expComplex(args) {
  return complexOf(Math.cos(-2*Math.PI*args),Math.sin(-2*Math.PI*args));
}

function addComplex(c1,c2) {
  return complexOf(c1["real"] + c2["real"],c1["img"] + c2["img"] );
}

function sousComplex(c1,c2) {
  return complexOf(c1["real"] - c2["real"],c1["img"] - c2["img"]);
}

function multComplex(c1,c2) {
  return complexOf(c1["real"] * c2["real"] - c1["img"] * c2["img"] ,c1["real"] * c2["img"] + c1["img"] * c2["real"]);
}

function divisComplex(c1,c2) {
  var diviseur = moduleComplex(c2);
  var complex = multComplex(c1,complexOf(c2["real"],-1*c2["img"]));

  return complexOf(complex["real"]/diviseur,complex["img"]/diviseur);
}

function moduleComplex(c) {
  var real = c["real"];
  var img = c["img"];
  return Math.sqrt(real*real + img*img);
}

function phaseComplex(c) {
  var real = c["real"];
  var img = c["img"];

  return Math.atan2(img,real);
}

function splitTable(data,N) {
  var pair = [];
  var impair = [];

  var end = Math.floor(N/2);

  for( var i= 0; i< end; ++i){
    pair.push(data[2*i]);
    impair.push(data[2*i + 1]);
  }

  return {"pair":pair,"impair":impair};
}

function calculTermeX(N,X1,X2,inverse) {
  var res = [];
  var end = Math.floor(N/2);

  for(var i = 0; i< end ; ++i){
    var i1 = i % ( end );

    var complexFact = expComplex(inverse*i/N);

    res[i] = (addComplex(X1[i1],multComplex(complexFact,X2[i1])));
    res[i + end] = (sousComplex(X1[i1],multComplex(complexFact,X2[i1])));
  }

  return res;
}


function fft(data,inverse) {

  var N = 0;
  if ( data != null ) {
    N = data.length;
  }

  var res = [];
  if ( N == 1 ) {

    if ( inverse == 1 ) {
      res.push(data[0]);
    }
    else if ( inverse == 0 ) {
      res.push(complexOf(data[0],0));
    }

  }
  else if ( N > 0 ) {
    var both = splitTable(data,N);
    var X1 = fft(both["pair"],inverse);
    var X2 = fft(both["impair"],inverse);

    if ( inverse == 1 ) {
      res = calculTermeX(N,X1,X2,-1);
    }
    else if ( inverse == 0 ) {
      res = calculTermeX(N,X1,X2,1);
    }
    else {
      console.log("Error argument inverse 0 ou 1");
    }
  }
  else {
    console.log("Error table length is NULL");
  }
  return res;
}

function amplitudePhase(dataC,incr) {
  var module = [];
  var phase = [];

  var frequency = 45056;

  var nbEltAnalyse = dataC.length;
  var N = (nbEltAnalyse/2) + 2;
  if ( incr > 0 ) {
    for(var i = 0 ; i < N ;i = i + incr) {
      var elt = dataC[i];

      module.push([frequency*i/nbEltAnalyse,moduleComplex(elt)]);
      phase.push([frequency*i/nbEltAnalyse,phaseComplex(elt)]);
    }
  }
  else {
    console.log("Incr must be a positif integer ");
  }

  return {"amplitude":module,"phase":phase,"nbData": N};
}

function inverseFFT(dataC,incr) {

  var inversefft = [];
  var frequency = 45056;

  var res = fft(dataC,1);
  var N = res.length;

  if ( incr > 0 ) {
    for(var i = 0 ; i < N ;i = i + incr ) {
      var elt = res[i];
      inversefft.push([frequency*i/N,elt["real"]/N]);
    }
  }
  else {
    console.log("Error incr must be a positif integer");
  }

  return inversefft;
}

function signalDetection(data) {
  var seuil = 0.05;
  var seuilB = 0.02;
  var res = [];
  var tmp = [];

  var register = false;
  var cmpt = 0;
  var cmpt2 = 0;

  var MAXDATABRUIT = 50;
  var frequency = 45056;
  var nbEltAnalyse = data.length;

  for(var i = 0; i < nbEltAnalyse;i = i + 128) {

    if( (Math.abs(data[i]) > seuil) || register ) {

      tmp.push([frequency*i/nbEltAnalyse,data[i]]);
      register = true;
      if ( Math.abs(data[i]) > seuil ) {
        cmpt = 0;
        cmpt2 = 0;
      }
    }

    if ( register ) {

      if (Math.abs(data[i]) <= seuilB) {
        cmpt2 += 5;
      }
      else if ( (Math.abs(data[i]) <= seuil)) {
        cmpt++;
        cmpt2=0;
      }

    }
    console.log(cmpt);

    if ( (cmpt > MAXDATABRUIT) || (cmpt2 > MAXDATABRUIT) ) {
      var n = tmp.length;
      var sub = tmp.slice(0,n-cmpt);
      res.push(sub);
      tmp = [];
      cmpt = 0;
      cmpt2 = 0;
      register = false;
    }
  }
  console.log(tmp.length);

  if ( tmp.length > 0 ) {
    var sub = tmp.slice(0,n-cmpt);
    res.push(sub);
  }
  console.log("taille sol: " + res.length);

  return res;
}


function testFFT() {

   console.log("test coucou");
   console.log();
   var c1 = expComplex(0);
   var c2 = expComplex(0);
   console.log("test somme 1+0*i + 1 + 0*i");
   console.log("real:" + addComplex(c1,c2)["real"]);
   console.log("img:" + addComplex(c1,c2)["img"]);

   var data = [0,1,2,3,4,5,6,7];
   var dataC = fft(data,0);
   console.log("fft");
   console.log(dataC);
   console.log(amplitudePhase(dataC,1));
   console.log("inverse fft");
   var inverseF  = inverseFFT(dataC,1);

   var N = inverseFFT.length;
   console.log( inverseF);

};

