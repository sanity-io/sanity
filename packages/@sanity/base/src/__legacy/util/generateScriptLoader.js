/* Output (rougly):
 *  (function(doc, urls) {
 *    if (typeof window.fetch === 'undefined') {
 *      var el = doc.getElementById('sanity');
 *      var html = ''
 *      html += '<div style="position:relative;height:100%;">';
 *      html += '  <div style="height:100%;width:100%;position:absolute;top:45%;text-align:center;font-family:helvetica, arial, sans-serif;">';
 *      html += '    <h1>Browser not supported</h1>';
 *      html += '    <p>Please use a modern browser such as <a href="https://www.google.com/chrome/">Chrome</a> or <a href="https://www.getfirefox.org/">Firefox</a>.</p>';
 *      html += '  </div>';
 *      html += '</div>';
 *      var node = el;
 *      do {
 *        node.style.height = '100%';
 *        node = node.parentNode;
 *      } while (node.parentNode);
 *      el.innerHTML = html;
 *      return;
 *    }
 *
 *    urls.forEach(function(src) {
 *      var script = doc.createElement('script');
 *      script.src = src;
 *      script.async = false;
 *      doc.head.appendChild(script);
 *    });
 *  })(document, ['a.js', 'b.js']);
 */

export default (scripts) => {
  const urls = `[${scripts.map(JSON.stringify).join(',')}]`
  return `/* Script loader */\n!function(e,t){if(void 0!==window.fetch)t.forEach(function(t){var o=e.createElement("script");o.src=t,o.async=!1,e.head.appendChild(o)});else{var o=e.getElementById("sanity");'<div style="height:100%;width: 100%;position: absolute;top:45%;text-align:center;font-family:helvetica, arial, sans-serif;">',"<h1>Browser not supported</h1>",'<p>Please use a modern browser such as <a href="https://www.google.com/chrome/">Chrome</a> or <a href="https://www.getfirefox.org/">Firefox</a>.</p>',"</div>","</div>";var r=o;do{r.style.height="100%",r=r.parentNode}while(r.parentNode);o.innerHTML='<div style="position:relative;height:100%;"><div style="height:100%;width: 100%;position: absolute;top:45%;text-align:center;font-family:helvetica, arial, sans-serif;"><h1>Browser not supported</h1><p>Please use a modern browser such as <a href="https://www.google.com/chrome/">Chrome</a> or <a href="https://www.getfirefox.org/">Firefox</a>.</p></div></div>'}}(document,${urls});`
}
