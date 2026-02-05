// Prevent these from being used as DOM id
// If used as an element's id (e.g. <input id="parentNode" />, parentNode will become a property on `window`
// which breaks upwards traversal checks using !el.parentNode as their stop condition
const UNSAFE_NAMES = [
  'parentNode',
  'childNodes',
  'firstChild',
  'lastChild',
  'nextSibling',
  'previousSibling',
  'parentElement',
  'textContent',
  'nodeType',
  'nodeName',
  'nodeValue',
  'ownerDocument',
  'baseURI',
  'isConnected',
  'children',
  'firstElementChild',
  'lastElementChild',
  'nextElementSibling',
  'previousElementSibling',
  'childElementCount',
  'innerHTML',
  'outerHTML',
  'className',
  'classList',
  'tagName',
  'attributes',
  'scrollTop',
  'scrollLeft',
  'scrollWidth',
  'scrollHeight',
  'clientTop',
  'clientLeft',
  'clientWidth',
  'clientHeight',
  'offsetParent',
  'offsetTop',
  'offsetLeft',
  'offsetWidth',
  'offsetHeight',
]

export function getSafeDomId(input: string) {
  return UNSAFE_NAMES.includes(input) ? `sanitized-${input}` : input
}
