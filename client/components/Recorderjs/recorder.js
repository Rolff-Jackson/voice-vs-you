(function(window){

  var WORKER_PATH = 'components/Recorderjs/recorderWorker.js';

  var Recorder = function(source, cfg){
    var config = cfg || {};
    var bufferLen = config.bufferLen || 4096;
    var numChannels = config.numChannels || 2;
    this.context = source.context;
    this.node = (this.context.createScriptProcessor ||
                 this.context.createJavaScriptNode).call(this.context,
                 bufferLen, numChannels, numChannels);

    var worker = new Worker(config.workerPath || WORKER_PATH);
   // var worker2 = new Worker(config.workerPath || WORKER_PATH);

    worker.postMessage({
      command: 'init',
      config: {
        sampleRate: this.context.sampleRate,
        numChannels: numChannels
      }
    });

    var recording = false,
      currCallback;

    /*worker2.postMessage({
      command: 'init',
      config: {
        sampleRate: this.context.sampleRate,
        numChannels: numChannels
      }
    });

    var bufferGlob = [];
    for (var channel = 0; channel < numChannels; channel++){
      bufferGlob[channel] = [];
    }*/

    this.node.onaudioprocess = function(e){
      if (!recording) return;
      var buffer = [];
      for (var channel = 0; channel < numChannels; channel++){
         // bufferGlob[channel].push(e.inputBuffer.getChannelData(channel));
          buffer.push(e.inputBuffer.getChannelData(channel));
      }

      worker.postMessage({
        command: 'record',
        buffer: buffer
      });
    }

    this.configure = function(cfg){
      for (var prop in cfg){
        if (cfg.hasOwnProperty(prop)){
          config[prop] = cfg[prop];
        }
      }
    }

    this.record = function(){
      recording = true;
    }

    this.stop = function(){
      recording = false;
    }

    this.clear = function(){
      worker.postMessage({ command: 'clear' });
    }

    this.getBuffer = function(cb) {
      currCallback = cb || config.callback;
      worker.postMessage({ command: 'getBuffer' })
    }

    this.getBufferSub = function(cb,indice) {
      currCallback = cb || config.callback;

      worker.postMessage(
        {
          command: 'getBufferSub',
          config: {
            info: indice
          }
        });
    }

    /*this.getBufferSub2 = function(cb,indice) {
      currCallback = cb || config.callback;

      worker2.postMessage(
        {
          command: 'getBufferSub2',
          config: {
            info: indice,
            buffer: bufferGlob
          }
        });
    }*/

    this.exportWAV = function(cb, type){

      currCallback = cb || config.callback;
      type = type || config.type || 'audio/wav';

      if (!currCallback) throw new Error('Callback not set');

      worker.postMessage({
        command: 'exportWAV',
        type: type
      });
    }

    worker.onmessage = function(e){
      var blob = e.data;
      currCallback(blob);
    }

  /*  worker2.onmessage = function(e){
      var blob = e.data;
      currCallback(blob);
      console.log(bufferGlob);
    }*/

    source.connect(this.node);
    this.node.connect(this.context.destination);    //this should not be necessary
  };

  Recorder.forceDownload = function(blob, filename){
    var url = (window.URL || window.webkitURL).createObjectURL(blob);
    var link = window.document.createElement('a');
    link.href = url;
    link.download = filename || 'output.wav';
    var click = document.createEvent("Event");
    click.initEvent("click", true, true);
    link.dispatchEvent(click);
  }

  window.Recorder = Recorder;

})(window);
