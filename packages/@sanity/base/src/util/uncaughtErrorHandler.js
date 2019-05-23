/* eslint-disable no-var, prefer-template */
/* Unminified: */
/*
function errHandler(msg, url, lineNo, columnNo, error) {
  window.lolerr = error
  var err = error || msg
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
  `/* Global error handler */\nwindow.onerror = function(e,t,n,o,l){var a=l||e,r=document.getElementById("sanity"),d=document.createElement("div");d.style.position="absolute",d.style.top="50%",d.style.left="50%",d.style.transform="translate(-50%, -50%)";var s=document.createElement("h1");s.innerText="Uncaught error";var i=document.createElement("pre"),c=document.createElement("code");i.style.fontSize="0.8em",i.style.opacity="0.7",i.style.overflow="auto",i.style.maxHeight="70vh";var m=a.stack&&a.stack.replace(a.message,"").replace(/^error: *\\n?/i,""),p=(a.stack?a.message:a.toString())+(a.stack?"\\n\\nStack:\\n\\n"+m:"")+"\\n\\n(Your browsers Developer Tools may contain more info)";c.textContent=p;var y=document.createElement("button");for(y.style.padding="0.8em 1em",y.style.marginTop="1em",y.style.border="none",y.style.backgroundColor="#303030",y.style.color="#fff",y.style.borderRadius="4px",y.onclick=function(){window.location.reload()},y.textContent="Reload",i.appendChild(c),d.appendChild(s),d.appendChild(i),d.appendChild(y);r.firstChild;)r.removeChild(r.firstChild);r.appendChild(d)}`
