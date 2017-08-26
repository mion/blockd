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
  $( '#content' ).html('<p>start typing...</p>');
  var paragraphs = [[]];
  let _render = () => {
    let html = _.reverse(paragraphs.map((p) => { return `<p>${p.join('')}</p>`; })).join('')
    $( '#content' ).html(html);
  };
  let _add = (key) => _.first(paragraphs).push(key);
  let _newLine = () => paragraphs.unshift([]);
  let _reset = () => paragraphs = [[]];
  var dot = false;
  $( 'body' ).keydown((event) => {
    var key = event.originalEvent.key;
    let code = event.keyCode;
    log(`key down ${key} (${code})`);
    let allowed = [' ', ',', '.', ';', ':', '?', '!', '-'];
    if (key === 'Escape') {
      var text = $("#content").html();
      var filename = _.last(paragraphs).map( (word) => { return word.replace(' ', '-').toLowerCase(); } ).join('');
      if (filename !== null && filename !== 'undefined' && filename !== '') {
        var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
        let ret = saveAs(blob, filename+".html");
      }
      _reset();
    };
    if (key === '.') { log('dot'); dot = true; }
    console.log('d: ', dot);
    if (dot && (code >= 65 && code <= 90)) {
      key = key.toUpperCase();
      dot = false;
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
