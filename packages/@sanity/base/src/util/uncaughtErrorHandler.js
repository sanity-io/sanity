/* eslint-disable no-var, prefer-template */
/* Unminified: */
/*
function errHandler(msg, url, lineNo, columnNo, err) {
  // Certain events (ResizeObserver max loop threshold, for instance)
  // only gives a _message_. We choose to ignore these events since
  // they are usually not _fatal_
  if (!err) {
    return
  }

  // Certain errors should be ignored
  if ([
    /unexpected token <$/i // Trying to load HTML as JS
  ].some(item => item.test(err.message))) {
    return
  }

  var container = document.getElementById('sanity')
  var wrapper = document.createElement('div')
  wrapper.style.position = 'absolute'
  wrapper.style.top = '50%'
  wrapper.style.left = '50%'
  wrapper.style.transform = 'translate(-50%, -50%)'

  var header = document.createElement('h1')
  header.innerText = 'Uncaught error'

  var pre = document.createElement('pre')
  var stack = document.createElement('code')
  pre.style.fontSize = '0.8em'
  pre.style.opacity = '0.7'
  pre.style.overflow = 'auto'
  pre.style.whiteSpace = 'pre-wrap'
  pre.style.maxHeight = '70vh'

  var cleanStack = err.stack && err.stack.replace(err.message, '').replace(/^error: *\n?/i, '')
  var errTitle = err.stack ? err.message : err.toString()
  var errStack = err.stack ? '\n\nStack:\n\n' + cleanStack : ''
  var errString = errTitle + errStack + '\n\n(Your browsers Developer Tools may contain more info)'
  stack.textContent = errString

  var reload = document.createElement('button')
  reload.style.padding = '0.8em 1em'
  reload.style.marginTop = '1em'
  reload.style.border = 'none'
  reload.style.backgroundColor = '#303030'
  reload.style.color = '#fff'
  reload.style.borderRadius = '4px'

  reload.onclick = function() {
    window.location.reload()
  }
  reload.textContent = 'Reload'

  pre.appendChild(stack)
  wrapper.appendChild(header)
  wrapper.appendChild(pre)
  wrapper.appendChild(reload)

  while (container.firstChild) {
    container.removeChild(container.firstChild)
  }

  container.appendChild(wrapper)
}

export default () => `window.onerror = ${errHandler.toString()}`
*/

export default () =>
  '/* Global error handler */ window.onerror = function(e,t,n,o,r){if(r&&![/unexpected token <$/i].some(e=>e.test(r.message))){var a=document.getElementById("sanity"),l=document.createElement("div");l.style.position="absolute",l.style.top="50%",l.style.left="50%",l.style.transform="translate(-50%, -50%)";var s=document.createElement("h1");s.innerText="Uncaught error";var d=document.createElement("pre"),i=document.createElement("code");d.style.fontSize="0.8em",d.style.opacity="0.7",d.style.overflow="auto",d.style.whiteSpace="pre-wrap",d.style.maxHeight="70vh";var c=r.stack&&r.stack.replace(r.message,"").replace(/^error: *\\n?/i,""),m=(r.stack?r.message:r.toString())+(r.stack?"\\n\\nStack:\\n\\n"+c:"")+"\\n\\n(Your browsers Developer Tools may contain more info)";i.textContent=m;var p=document.createElement("button");for(p.style.padding="0.8em 1em",p.style.marginTop="1em",p.style.border="none",p.style.backgroundColor="#303030",p.style.color="#fff",p.style.borderRadius="4px",p.onclick=function(){window.location.reload()},p.textContent="Reload",d.appendChild(i),l.appendChild(s),l.appendChild(d),l.appendChild(p);a.firstChild;)a.removeChild(a.firstChild);a.appendChild(l)}}'
