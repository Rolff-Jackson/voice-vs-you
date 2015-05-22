
self.addEventListener('message', function(e) {
  switch(e.data.command) {
    case 'k_mean':
      self.postMessage(
        k_mean(e.data.info,e.data.points,e.data.nbClass,e.data.valMax, e.data.maxError)
      );
      break;
    case 'minDistance':
      self.postMessage(
        minDistance(e.data.points,e.data.barycentres,e.data.sizeClass)
      );
      break;
    case 'bestVoice':
      self.postMessage(
        bestVoice(e.data.allInfo,e.data.points)
      );
      break;
  }
}, false);

function data(point) {
  var val;
  if ( point.length > 1 ) {
    val = point[1];
  }
  else {
    val = point;
  }
  return val;
}
function Neuclidienne(vect) {
  var Nres = 0;
  for(var i = 0 ; i < vect.length; i++) {
    var elt = vect[i];
    Nres += elt*elt;
  }

  return Math.sqrt(Nres);
}

function diffVector(v1,v2) {
  var res = [];
  for(var i = 0; i < v1.length; i++) {
    var val1, val2;
    val1 = data(v1[i]);
    val2 = data(v2[i]);

    res.push(val1 - val2);
  }

  return res;
}

function setBarycentres(nbClass,dimension,valMax) {

  // test si l'utilisateur existe id Name.
  var barycentres = new Array(nbClass);
  for(var i=0; i < nbClass;i++) {
    barycentres[i] = new Array(dimension);

    for(var j = 0 ; j < dimension;j++) {
      var num = valMax * Math.random();
      barycentres[i][j] = num;
    }
  }

  return barycentres;
}

function removeClass(barycentres,oldClass,point,sizeClass) {
  var size = sizeClass[oldClass];

  for(var i=0; i < point.length; i++) {
    if ( size > 0 ) {
      barycentres[oldClass][i] *= size;
    }

    barycentres[oldClass][i] -= data(point[i]);
    if ( size > 1 ) {
      barycentres[oldClass][i] /= (size - 1);
    }
  }
  sizeClass[oldClass] = size - 1;
}

function addClass(barycentres,newClass,point,sizeClass) {
  var size = sizeClass[newClass];

  for(var i=0; i < point.length; i++) {
    if ( size > 0 ) {
      barycentres[newClass][i] *= size;
    }

    barycentres[newClass][i] += data(point[i]);
    barycentres[newClass][i] /= (size + 1);
  }
  sizeClass[newClass] = size + 1;
}

function actuClass(barycentres,newClass,numPoint,point,groupePoint,sizeClass) {
  var oldClass = groupePoint[numPoint];

  if ( sizeClass[oldClass] > 0 ) {
    removeClass(barycentres,oldClass,point,sizeClass);
  }
  addClass(barycentres,newClass,point,sizeClass);
  groupePoint[numPoint] = newClass;
}

function stabiliseBary(oldClass,barycentres,maxError) {

  for(var i = 0;i < barycentres.length; i++) {
    var vectDiff = diffVector(barycentres[i],oldClass[i]);
    var diff = Neuclidienne(vectDiff);

    if ( diff > maxError ) {
      return false;
    }
  }

  return true;
}

function bestVoice(allInfo,points) {
  var min = -1;
  var who = 0;

  for(var i = 0; i < allInfo.length; i++) {
    var barycentres = allInfo[i].barycentre;
    var sizeClass = allInfo[i].sizeClass;
    console.log(barycentres);

    var res = minDistance(points,barycentres,sizeClass);

    console.log(i + ":" + res);

    if ( (res < min) || (min < 0) ) {
      min = res;
      who = i;
    }
  }

  return allInfo[who].name;
}

function minDistance(points,barycentres,sizeClass) {
  var vectDiff = [];
  var min = -1;
  var norme = 0;
  var res = 0;

  var somme = 0;
  var indiceMin = 0;

  for(var i = 0 ; i < points.length; i++) {
    min = -1;
    for(var j = 0 ; j < barycentres.length; j++) {
        vectDiff = diffVector(barycentres[j],points[i]);
        norme = Neuclidienne(vectDiff);

        if ( (sizeClass[j] > 0) && (norme < min) || (min < 0) ) {
          min = norme;
          indiceMin = j;
        }
    }
    res += sizeClass[indiceMin] * min;
    somme += sizeClass[indiceMin];
  }

  return (res/somme);
}

function k_mean(info,points,nbClass,valMax,maxError) {
  var maxBoucle = 0;
  var dimension = points[0].length;

  var sizeClass = Array(nbClass+1).join('0').split('').map(parseFloat);
  // give the classes associated to point j
  var groupePoint = Array(nbClass+1).join('0').split('').map(parseFloat);

  // create random barycentre
  var barycentres;
  if ( info.length > 0 ) {
    sizeClass = info[0].sizeClass;
    barycentres = info[0].barycentre;
  }
  else {
    barycentres = setBarycentres(nbClass,dimension,valMax);
  }

  // save class to compare before and after algo
  var oldClass = [];

  do {
    //copy class to be saved
    oldClass = JSON.parse(JSON.stringify(barycentres));

    for(var j = 0 ; j < points.length; j++) {
      var min = -1;
      var classMin = -1;

      for(var i = 0; i < barycentres.length; i++) {
        var vectDiff = diffVector(barycentres[i],points[j]);
        var norme = Neuclidienne(vectDiff);

        if ( (norme < min) || (min < 0) ) {
          min = norme;
          classMin = i;
        }
      }
      //actualise les barycentres
      actuClass(barycentres,classMin,j,points[j],groupePoint,sizeClass);
    }
    maxBoucle++;
    //test bary stabilise
  } while( !stabiliseBary(barycentres,oldClass,maxError) && (maxBoucle < 1000) );
  console.log("boucle algo: " + maxBoucle);
  return {bary: barycentres,sizeClass: sizeClass};
}
