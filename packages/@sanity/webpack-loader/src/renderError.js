/* eslint-disable */
setTimeout(function () {
  var styles = {
    background: '#cc0000',
    color: '#fff',
    fontFamily: 'sans-serif',
    position: 'fixed',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    padding: '1em',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  }

  var errBox = document.createElement('div');
  for (var key in styles) {
    errBox.style[key] = styles[key]
  }

  var header = document.createElement('h2');
  header.innerHTML = '%ERR.MESSAGE%';

  var stack = document.createElement('pre');
  var code = document.createElement('code');
  code.appendChild(document.createTextNode('%ERR.STACK%'));
  code.style.whiteSpace = 'pre-wrap';

  stack.appendChild(code);
  errBox.appendChild(header);
  errBox.appendChild(stack);

  var sanity = document.getElementById('sanity');
  sanity.appendChild(errBox);
}, 10)
