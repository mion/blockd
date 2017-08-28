function log(msg) {
  if (typeof msg === 'string') {
    console.log(`[*] ${msg}`);
  } else {
    console.log(`[* object]`);
    console.log(msg);
  }
}

log('loading blockd.js...')

function ok(msg) { log(msg) }
function ko(msg) { console.error(msg) }


let blockd = {
    paragraphs: [[]],
    currentParagraph: function () {
        return _.last(this.paragraphs)
    },
    mode: {},
    handled: [],
    regexps: [],
    regexpFuncs: [],
    codes: [],
    codeFuncs: [],
    transform: function (regexpOrCode, func) {
        if (typeof regexpOrCode === 'number') {
            let code = regexpOrCode
            this.codes.push(code)
            this.codeFuncs.push(func)
        } else if (typeof regexpOrCode === 'object') {
            let regexp = regexpOrCode
            this.regexps.push(regexp)
            this.regexpFuncs.push(func)
        } else {
            ko('transform used incorrectly')
        }
        return null
    },
    handle: function (string, code) {
        let identityTransformationFunc = (s, c, b) => { return s }
        var transformationFunc = null
        for(var i = 0; i < this.codes.length; i++) {
            if (this.codes[i] === code) {
                if (transformationFunc !== null) { ko('code conflict: ' + code); break }
                transformationFunc = this.codeFuncs[i]
            }
        }
        for (var i = 0; i < this.regexps.length; i++) {
            if (this.regexps[i].test(string)) {
                if (transformationFunc !== null) { ko('string conflict: ' + string); break }
                transformationFunc = this.regexpFuncs[i]
            }
        }
        if (transformationFunc === null) {
            transformationFunc = identityTransformationFunc
        }
        let transformedString = transformationFunc(string, code, this)
        if (_.isUndefined(transformedString) || _.isNull(transformedString)) {
            ok(`blocked '${string}' (${code})`)
            this.handled.push({blocked: true, raw: string, transformed: transformedString, code: code})
        } else {
            this.add(transformedString)
            ok(`transformed '${string}' (${code}) -> '${transformedString}'`)
            this.handled.push({blocked: false, raw: string, transformed: transformedString, code: code})
        }
        return null
    },
    removeLast: function () {
        let removed = this.currentParagraph().pop()
        return removed
    },
    getLast: function () {
        return _.last(this.currentParagraph())
    },
    add: function () {
        for (var i = 0; i < arguments.length; i++) {
            let string = arguments[i]
            if (string === '<' || string === '>') {
                ko('cannot add < or > as it screws up html')
            } else  {
                this.currentParagraph().push(string)
            }
        }
        return null
    },
    newParagraph: function () {
        this.paragraphs.push([])
        return null
    },
    render: function () {
        let textParagraphs = _.map(this.paragraphs, (p) => { return p.join('') })
        // WIP this.countWords(textParagraphs)
        let html = _.map(textParagraphs, (text) => { return `<p>${text}</p>` }).join("\n")
        return html
    },
    /* WIP
    store: function (key, obj) {
        localStorage.setItem(key, JSON.stringify({object: obj}))
        return null
    },
    retrieve: function (key) {
        let item = localStorage.getItem(key)
        if (item !== null) { return JSON.parse(item).object }
        else return null
    },
    countWords: function (textParagraphs) {
        const STATS = "blockdStats"
        var stats = this.retrieve(STATS)
        if (stats === null) {
            stats = {words: 0}
        }
    },
    */
    backup: function () {
        let jsonString = JSON.stringify({paragraphs: this.paragraphs})
        try {
            localStorage.setItem("blockdLastRenderedHTML", jsonString) // TODO: edge cases
            return null
        } catch (e) {
            alert("Something went wrong while backing up the HTML. Be careful.")
            ko(e)
            return null
        }
    },
    restoreBackup: function () {
        try {
            let backupJSON = JSON.parse(localStorage.getItem("blockdLastRenderedHTML"))
            this.paragraphs = backupJSON.paragraphs
            return null
        } catch (e) {
            ok("No backup available")
            ok(e)
            return null
        }
    },
    eraseBackup: function () {
        try {
            localStorage.setItem("blockdLastRenderedHTML", "") // TODO: edge cases
            return null
        } catch (e) {
            alert("Something went wrong while erasing the backed up HTML.")
            ko(e)
            return null
        }
    },
    eraseCurrentContent: function () {
        this.paragraphs = [[]]
        return null
    },
    updateDisplay: function () {
        $( '#content' ).html( this.render() )
        return null
    }
}

blockd.add('$', 'd', 'e', 'b', 'u', 'g', '$')
blockd.newParagraph()
blockd.transform( /Escape/, (str, code, app) => {
    let filename = prompt('Save to filename?')
    if (filename === '' || _.isNull(filename)) {
        return null
    }
    let payload = {
        filename: filename,
        html: app.render(),
    }
    $.ajax({
        method: 'POST',
        url: '/blocks',
        data: JSON.stringify(payload),
        success: () => { 
            app.eraseBackup()
            app.eraseCurrentContent() 
            app.updateDisplay()
        },
        error: () => { 
            if (confirm('Server failed to save. Force save as text?')) {
                var blob = new Blob([payload.html], {type: "text/plain;charset=utf-8"});
                let ret = saveAs(blob, filename+".txt");
            }
        }
    })
})
blockd.transform( /Enter/, (str, code, app) => { app.newParagraph() } )
blockd.transform( /Tab|Alt|Shift|Meta/, () => { } )
blockd.transform( /\./, (str, code, app) => { 
    app.mode.caps = true
    return str 
})
blockd.transform( /Backspace/, (str, code, app) => { 
    if (/[a-zA-Z\'\"]/.test(app.getLast())) { 
        app.removeLast() 
    } 
})
blockd.transform( 32, () => { return ' ' } )
blockd.transform( 192, () => { return '"' } )
blockd.transform( 222, () => { return "'" } )
blockd.transform( /\>/, () => { return '→' }) // >
blockd.transform( /\</, () => { return '←' }) // <
blockd.transform( /\w/, (str, code, app) => { 
    if (app.mode.caps) { 
        delete app.mode.caps
        str = str.toUpperCase()
    } 
    return str 
})
blockd.transform( /\=/, () => { return '—' })

window.asd = blockd

blockd.restoreBackup()
$( document ).ready(() => {
    log('document ready')
    blockd.updateDisplay()
    $( 'body' ).keydown((event) => {
        blockd.backup()
        var key = event.originalEvent.key
        let code = event.keyCode
        blockd.handle(key, code)
        blockd.updateDisplay()
    })
})

/*
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
*/
log('loaded blockd.js')
