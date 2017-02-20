import Base64 from 'slate/lib/serializers/base-64'
import getWindow from 'get-window'
import {Document} from 'slate'

function formBuilderNodeOnCopy(formBuilder, editorFields) {

  function onCopy(event, data, state, editor) {

    let fragment = data.fragment
    if (fragment && state.blocks.size === 1 && state.blocks.first().isVoid) {
      fragment = new Document({
        key: data.fragment.key,
        nodes: state.blocks
      })
    } else {
      return null
    }

    const nextState = state.transform()
      .insertBlock('normal')
      .collapseToEndOfNextBlock()
      .apply()

    const window = getWindow(event.target)
    const native = window.getSelection()
    console.log(native)
    // const selection = nextState.selection.collapseToEndOfNextBlock()
    return nextState


    // const window = getWindow(event.target)
    // const native = window.getSelection()
    // const encoded = Base64.serializeNode(fragment)
    // const range = native.getRangeAt(0)
    // const contents = range.cloneContents()

    // // Remove any zero-width space spans from the cloned DOM so that they don't
    // // show up elsewhere when copied.
    // const zws = [].slice.call(contents.querySelectorAll('[data-slate-zero-width]'))
    // zws.forEach(zw => zw.parentNode.removeChild(zw))

    // // Wrap the first character of the selection in a span that has the encoded
    // // fragment attached as an attribute, so it will show up in the copied HTML.
    // const wrapper = window.document.createElement('span')
    // const text = window.document.createTextNode('void')
    // const char = text.textContent.slice(0, 1)
    // const first = window.document.createTextNode(char)
    // const rest = text.textContent.slice(1)
    // text.textContent = rest
    // wrapper.appendChild(first)
    // wrapper.setAttribute('data-slate-fragment', encoded)
    // contents.append(wrapper)

    // // Add the phony content to the DOM, and select it, so it will be copied.
    // const body = window.document.querySelector('body')
    // const div = window.document.createElement('div')
    // div.setAttribute('contenteditable', true)
    // div.style.position = 'absolute'
    // div.style.left = '-9999px'
    // div.appendChild(contents)
    // body.appendChild(div)

    // // COMPAT: In Firefox, trying to use the terser `native.selectAllChildren`
    // // throws an error, so we use the older `range` equivalent. (2016/06/21)
    // const r = window.document.createRange()
    // r.selectNodeContents(div)
    // native.removeAllRanges()
    // native.addRange(r)

    // // Revert to the previous selection right after copying.
    // window.requestAnimationFrame(() => {
    //   body.removeChild(div)
    //   native.removeAllRanges()
    //   native.addRange(range)
    // })

    return state
  }

  return {
    onCopy
  }
}

export default formBuilderNodeOnCopy
