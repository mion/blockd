function log(msg) {
  if (typeof msg === 'string') {
    console.log(`[*] ${msg}`);
  } else {
    console.log(`[* object: ${msg}]`);
    console.log(msg);
  }
}

function ok(js) {
  console.assert(eval(js), js)
}

log('loaded blockd.js');

$( document ).ready(() => {
  log('loaded jquery');
  ok("typeof content !== 'undefined'");
  $( '#content' ).html('<p>_</p>');
  var paragraphs = [['_']];
  let _render = () => {
    let html = paragraphs.map( (letters, paragraphIndex) => {
      return letters.join('');
    }).map((txt) => `<p>${txt}</p>`).join("");
    $( '#content' ).html(html);
  };
  let _add = (key) => { _.last(paragraphs).pop(); _.last(paragraphs).push(key); _.last(paragraphs).push('_'); }
  let _newLine = () => { _.last(paragraphs).pop(); paragraphs.push(['_']); }
  let _reset = () => { paragraphs = [['_']]; }
  log(paragraphs)
  var caps = true;
  $( 'body' ).keydown((event) => {
    var key = event.originalEvent.key;
    let code = event.keyCode;
    log(`key down ${key} (${code})`);
    let allowed = [ ' ', ',', '.', ';', ':', '?', '!', '-', ')', '(', '[', ']', '{', '}' ];
    if (key === 'Escape') {
      var text = $("#content").html();
      // var filename = _.last(paragraphs).map( (word) => { allowed.forEach((w) => { if (word != ' ') { word = word.replace(w, ''); } else { word = '-'; } }); return word.replace('_', '').toLowerCase(); } ).join('');
      var filename = prompt('Filename?');
      if (filename === null || filename === 'undefined' && filename === '') {
        filename = (new Date()).toString();
      }

      $.ajax({
        method: 'POST',
        url: '/blocks',
        data: JSON.stringify({filename: filename, paragraphs: paragraphs.map((letters) => letters.join(''))}),
        success: () => {
          _reset();
          _render();
        },
        error: () => {
          if (confirm('Failed to sync. Save local backup?')) {
            var filename = prompt('Filename?');
            if (filename === null || filename === 'undefined' && filename === '') {
              filename = (new Date()).toString();
            }
            var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
            let ret = saveAs(blob, filename+".html");
          }
        }
      });

      return;
    };
    if (key === '.') { log('caps'); caps = true; }
    console.log('d: ', caps);
    if (caps && (code >= 65 && code <= 90)) {
      key = key.toUpperCase();
      caps = false;
      log(key);
    }
    if ((allowed.indexOf(key) >= 0) || (code >= 65 && code <= 90)) {
      if (key === '-') { key = '—'; }
      if ([',', '.', ':', ';', '?', '!', '—'].indexOf(key) >= 0) { key = key + ' '; }
      _add(key);
    } else {
      if (key === 'Enter') {
        _newLine();
      } else if (key === 'Dead') {
        _add("'");
      } else if (code >= 48 && code <= 57) {
        let idx = code - 48;
        let words = ['none', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
        _add(words[idx] + ' ');
      }
    }
    _render();
  });
});
