/**
 * Created by mazurkiewicz on 11/02/15.
 */

var frequence = 45960;

self.addEventListener('message', function(e) {
  switch(e.data.command) {
    case 'traitementFFT':
      self.postMessage(
        traitementFFT(e.data.data, e.data.incr)
      );
      break;
    case 'cutSignal':
      var cutSignal = signalDetection(e.data.data);
      if ( cutSignal.length > 0 ) {
        self.postMessage(
          cutSignal
        );
      }
      else {
        console.log("Aucun Signal valide");
      }
      break;
    case 'algoMFCC':
      self.postMessage(
        allCoeffMFCC(e.data.dataMicro)
      );
      break;
    case 'filtreFreq':
      self.postMessage(
        filtreFreq(e.data.dataMicro, e.data.freqB, e.data.freqH)
      );
      break;
  }

}, false);


function extractDim(data,debut,fin,dim) {
  var res = [];
  for(var k=debut; k < fin;k++) {
    res.push(data[k][dim]);
  }

  return res;
}

function algoDCT(data) {
  var N = data.length;
  var y = new Array(2*N);

  for(var i = 0; i < N ;i++) {
    y[i] = data[i];
    y[2*N-i-1] = data[i];
  }

  var fftY = fft(y,0);
  var res = [];
  for(var i = 0; i < N;i++) {
    var tmp = multComplex(fftY[i],expComplex(i/4*N));

    var y = moduleComplex(tmp);
    y /= 2*Math.sqrt(N);
   // y = divisComplex(y,complexOf(2*Math.sqrt(N),0));

    res.push([i,y]);
  }

  return res;
}

// faire fenetrage hamming passe data et renvoie un tableau de fenetre !
/**
 *
 * @param data
 * @param lengthF
 * @param incrF
 * @returns {Array}
 * lengthF is length of one window and incrF is increment between two window
 */
function cutFenetrageHamming(data,lengthF,incrF) {
  // length must be two pow
  var res = [];
  var N = data.length;
  var ratio = (N-lengthF)/incrF;
  var nbFenetre = Math.floor(ratio);

  for(var k = 0; k < nbFenetre;k++) {

    var soundData = [];
    if (data[0].length > 1) {
      soundData = extractDim(data, k*incrF, k * incrF +  lengthF, 1);
    }
    else {
      soundData = data.subarray( k*incrF, k * incrF +  lengthF);
    }
    res.push(soundData);
  }
  return res;
}

function normalizeMFCC(data) {
  var N = data.length;
  var res = [];
  var moy = 0;
  var variance = 0;
  var nbCoeff = 13;

  if ( N > 0 ) {

    for(var k=1; k < nbCoeff + 1;k++) {

      if ( data[k].length > 1 ) {
        var tmp = data[k][1];
        moy += tmp;
        variance += (tmp * tmp);
      }
      else {
        moy+= data[k];
        variance += (data[k] * data[k]);
      }

    }

    variance /= nbCoeff;
    moy /= nbCoeff;
    variance -= (moy*moy);

    for(var k=1; k < nbCoeff + 1;k++) {

      if ( data[k].length > 1 ) {
        var tmp = (data[k][1]-moy) / variance;
        res.push([data[k][0],tmp]);
      }
      else {
        res.push((data[k]-moy)/variance);
      }

    }
  }
  else {
    console.log("Data Normalize is null");
  }

  return res;
}

function allCoeffMFCC(datas) {
  var coeffsMFCC = [];

  datas.forEach(function(signal,index) {
    algoMFCC(signal,coeffsMFCC);
  });

  return coeffsMFCC;
}

// à rajouter banc de Mel seulement entre 400 et 3400 Hertz
function algoMFCC(data,coeffsMFCC) {

  var N = data.length;

  if ( N > 0 ) {

    var cutHamming = cutFenetrageHamming(data,1024,256);
    var NbHamming = cutHamming.length;

    for(var k = 0;k < NbHamming ;k++) {
      var soundData = [];
      var tmp = [];
      soundData = fenetreHamming(cutHamming[k]);

      // calcul FFT
      var fftData = fft(soundData, 0);
      var infoFFT = [];

      if (fftData != null) {
        // calcul amplitude FFT
        infoFFT = amplitudePhase(fftData, 1);

        //cacul energie dans le banc de 32 filtre triangulaire echelle de Mel
        tmp = filtreMel(infoFFT["amplitude"],32);

        // calcul du log des energies
        tmp = logData(tmp);

        // algo DCT
        tmp = algoDCT(tmp);

        //sauvegarde des coefficients cepstraux
        //var normalize = normalizeMFCC(tmp);

        coeffsMFCC.push(tmp);
      }
      else {
        console.log("Erreur fftWorker.js/fftData null");
      }
    }

    if ( NbHamming == 0 ) {
      console.log("0 Hamming MFCC nbData: " + N);
    }
  }
  else {
    console.log("Erreur fftWorker.js/algoMFCC data.length null");
  }
}

function ZeroPadding(data) {
  var N = data.length;

  var puissance = Math.floor(Math.log(N)/Math.log(2));
  var nbEltAnalyse = Math.pow(2,puissance+1);

  var nbDataZeroPadding = nbEltAnalyse - N;

  var soundData =  new Float32Array(nbEltAnalyse);
  soundData.set(data,0);

  for(var k= 0; k < nbDataZeroPadding;k++) {
    soundData.set([0],N+k);
  }

  return soundData;
}

function freqToIndice(freq,N) {
  return Math.floor(freq * (N/frequence) );
}

function filtreFreq(data,start,end) {
  var N = data.length;
  var soundData = ZeroPadding(data);
  var nbEltAnalyse = soundData.length;

  var fftData = fft(soundData,0);

  var frequencyB = freqToIndice(start,nbEltAnalyse);
  var frequencyH = freqToIndice(end,nbEltAnalyse);

  for(var m = 0 ; m < frequencyB;m++ ) {
    fftData[m] = complexOf(0,0);
    fftData[nbEltAnalyse-m-1] = complexOf(0,0);
  }

  for(var k = frequencyH; k < nbEltAnalyse-frequencyH;k++ ) {
    fftData[k] = complexOf(0,0);
  }

  var signalReconstrut = fft(fftData,1);

  var arrayRes = new Float32Array(N);

  for(var k = 0; k < N;k++) {
    arrayRes[k] = signalReconstrut[k]["real"] / nbEltAnalyse;
  }

  return arrayRes;
}

function traitementFFT(data,incr) {

  var N = data.length;
  var nbEltAnalyse = Math.pow(2,Math.floor(Math.log(N)/Math.log(2)));
  if ( N > 0 ) {
    var soundData = [];
    //ZeroPadding(data);
    if ( data[0].length > 1 ) {
      soundData = extractDim(data,0,nbEltAnalyse,1);
    }
    else {
      soundData = data.subarray(0,nbEltAnalyse);
    }

    var fftData = fft(soundData,0);

    var fftReverse= [];
    var infoFFT = [];

    if ( fftData != null ) {

      fftReverse = inverseFFT(fftData, incr);
      infoFFT = amplitudePhase(fftData, incr);

    }
    else {
      console.log("Erreur fftWorker.js/fftData null");
    }
  }
  else{
    console.log("Erreur fftWorker.js/traitementFFT data.length null");
  }

  console.log(infoFFT);

  return {"info": infoFFT, "reverse":fftReverse}
}

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

function echelleFreq_Mel(freq) {
  var arg = 1 +freq/700;
  var res = 2595 * Math.log(arg);
  return res;
}

function echelleMel_Freq(freq) {
  var arg = 1 +freq/700;
  var res = 2595 * Math.log(arg);
  return res;
}

function fenetreHamming(data) {
  var res = [];
  var T = data.length-1;

  for(var k = 0; k <= T;k++) {
    var t = data[k];
    var tmp = 0.54 - 0.46 * Math.cos(2*Math.PI * t/T);
    res.push(tmp*t);
  }

  return res;
}

function filtreTriangulaire(t,T) {
  if ( t < T/2 ) {
    return 2*(t-T)/T;
  }
  else {
    return 2*(T-t)/T;
  }
}

// fonction utilisée sur l'amplitude du signal FFT
// idee : ajuster pour freq entre 300 et 3400
function filtreMel(data,nbFiltre) {
  var N = data.length;

 /* var start = freqToIndice(300,N);
  var end = freqToIndice(3400,N);
  var T = 2*(echelleFreq_Mel(3400)-echelleFreq_Mel(300)+1)/nbFiltre;*/

  var T = 2*(echelleFreq_Mel(data[N-1][0])+1)/nbFiltre;
  var start = 0;
  var end = N;

  var res = [];

  for(var f = 0; f < nbFiltre;f++) {
    res.push([f,0]);
  }

  for(var i= start; i < end ;i++) {
    var mel = echelleFreq_Mel(data[i][0]);
    var filtre = 0;

    var k = Math.floor(mel/T);

    if ( mel <= (k+1)*T  && mel >= k*T ) {
      var energie = data[i][1]*filtreTriangulaire(mel-k*T,T);
      res[2*k][1] += energie*energie;

      if ( filtre == 0 ) {
        filtre = 1;
      }
    }

    if ( ( mel <= T*(k + 1.5))  && ( mel >= T*(k+0.5) ) ) {
      var energie = data[i][1]*filtreTriangulaire(mel-(k+0.5)*T,T);
      res[2*k+1][1] += energie*energie;
      if ( filtre == 0 ) {
        filtre = 1;
      }
    }
  }

  return res;
}

function logData(data) {
  for(var i = 0; i < data.length;i++) {
    if ( data[i][1] > -1 ) {
      data[i] = Math.log(1 + data[i][1]);
    }
    else {
      data[i] = 0;
      console.log("Error calcul log MFCC data[i][1] negatif");
    }
  }
  return data;
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

  var nbEltAnalyse = dataC.length;

  if ( incr > 0 ) {
    for(var i = 0 ; i < nbEltAnalyse ;i = i + incr) {
      var elt = dataC[i];
      var xFreq  = frequence*i/nbEltAnalyse;

      module.push([xFreq,moduleComplex(elt)]);
      phase.push([xFreq,phaseComplex(elt)]);
    }
  }
  else {
    console.log("Incr must be a positif integer ");
  }

  return {"amplitude":module,"phase":phase,"nbData": nbEltAnalyse};
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

// ) refaire decoupe signal
function signalDetection(data) {
  var seuil = 0.05;
  var seuilB = 0.02;
  var seuilObli = 0.1;

  var res = [];
  var tmp = [];

  var register = false;
  var cmpt = 0;
  var cmpt2 = 0;

  var MAXDATABRUIT = 50*128;
  var nbEltAnalyse = data.length;

  var max = -1;


  // ajout min max amplitude sound ( moyenne de tout les sound ) + longeur moyenne detect signal
  for(var i = 0; i < nbEltAnalyse;i++) {

    if( (Math.abs(data[i]) > seuil) || register ) {

      tmp.push([i,data[i]]);
      register = true;
      if ( Math.abs(data[i]) > seuil ) {
        cmpt = 0;
        cmpt2 = 0;
      }

      if ( Math.abs(data[i]) > max ) {
        max = Math.abs(data[i]);
      }
    }

    // detection d'un bruit
    if ( register ) {

      if (Math.abs(data[i]) <= seuilB) {
        cmpt2 += 5;
      }
      else if ( (Math.abs(data[i]) <= seuil)) {
        cmpt++;
        cmpt2=0;
      }

    }

    // enregistrement si on a un bruit trop long
    if ( (cmpt > MAXDATABRUIT) || (cmpt2 > MAXDATABRUIT) ) {
      if ( max > seuilObli ) {
        var n = tmp.length;
        var sub = tmp.slice(0,n-cmpt);
        res.push(sub);
      }

      tmp = [];
      cmpt = 0;
      cmpt2 = 0;
      max = -1;

      register = false;
    }
  }

  if ( (tmp.length > 0)  && (max > seuilObli) ) {
    var n = tmp.length;

    var sub = tmp.slice(0,n-cmpt);
    res.push(sub);
  }
  console.log("taille sol: " + res.length);

  return res;
}
