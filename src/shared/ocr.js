/* Lazy OCR: Tesseract.js is only fetched from CDN the first time KX.ocrText() is actually
   called (e.g. when the client taps "Scan ID / passport"), so pages that never use it pay
   nothing extra on load. The worker is created once and reused for later scans. */
(function () {
  var KX = window.KX;
  var workerPromise = null;
  var currentOnProgress = null; // the worker (and its logger) is created once and reused, but each
                                 // call to KX.ocrText can pass its own onProgress - route to whichever
                                 // one is current rather than freezing on the first caller's.

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('load-failed')); };
      document.head.appendChild(s);
    });
  }

  function getWorker(onProgress) {
    currentOnProgress = onProgress;
    if (workerPromise) return workerPromise;
    workerPromise = loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js')
      .then(function () {
        if (!window.Tesseract) throw new Error('load-failed');
        return window.Tesseract.createWorker('eng', undefined, {
          logger: function (m) { if (currentOnProgress && m.status === 'recognizing text') currentOnProgress(m.progress); }
        });
      })
      .then(function (worker) {
        return worker.setParameters({ tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<' }).then(function () { return worker; });
      })
      .catch(function (e) { workerPromise = null; throw e; }); // let a failed load be retried next time
    return workerPromise;
  }

  /* file: a File/Blob (e.g. from <input type=file>). onProgress(0..1) is optional. */
  KX.ocrText = function (file, onProgress) {
    return getWorker(onProgress).then(function (worker) {
      return worker.recognize(file).then(function (r) { return r.data.text; });
    });
  };
})();
