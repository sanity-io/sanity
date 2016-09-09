import Character from 'slate/dist/models/character'
import Selection from 'slate/dist/models/selection'
import Debug from 'debug'
import Placeholder from 'slate/dist/components/placeholder'
import React from 'react'
import String from 'slate/dist/utils/string'

/**
 * Debug.
 *
 * @type {Function}
 */

const debug = Debug('slate:core')

/**
 * The default plugin.
 *
 * @param {Object} options
 *   @property {Element} placeholder
 *   @property {String} placeholderClassName
 *   @property {Object} placeholderStyle
 * @return {Object}
 */

export default function Plugin(options = {}) {
  const {
    placeholder,
    placeholderClassName,
    placeholderStyle,
    onPatch
  } = options

  /**
   * On before change, enforce the editor's schema.
   *
   * @param {State} state
   * @param {Editor} schema
   * @return {State}
   */

  function onBeforeChange(state, editor) {
    if (state.isNative) {
      return state
    }
    const schema = editor.getSchema()
    return state.normalize(schema)
  }

  /**
   * On before input, see if we can let the browser continue with it's native
   * input behavior, to avoid a re-render for performance.
   *
   * @param {Event} e
   * @param {Object} data
   * @param {State} state
   * @param {Editor} editor
   * @return {State}
   */

  function onBeforeInput(e, data, state, editor) {
    const {document, startKey, startOffset, startText} = state

    // Determine what the characters would be if natively inserted.
    const schema = editor.getSchema()
    const decorators = document.getDescendantDecorators(startKey, schema)
    const prevChars = startText.getDecorations(decorators)
    const prevChar = prevChars.get(startOffset - 1)
    const char = Character.create({
      text: e.data,
      marks: prevChar && prevChar.marks
    })

    const chars = prevChars
      .slice(0, startOffset)
      .push(char)
      .concat(prevChars.slice(startOffset))

    // Determine what the characters should be, if not natively inserted.
    const next = state
      .transform()
      .insertText(e.data)
      .apply()

    const nextText = next.startText
    const nextChars = nextText.getDecorations(decorators)

    // We do not have to re-render if the current selection is collapsed, the
    // current node is not empty, there are no marks on the cursor, and the
    // natively inserted characters would be the same as the non-native.
    const isNative = (
      state.isCollapsed
      && state.startText.text != ''
      && state.cursorMarks == null
      && chars.equals(nextChars)
    )

    // If not native, prevent default so that the DOM remains untouched.
    if (!isNative) {
      e.preventDefault()
    }

    // Determine what the characters should be, if not natively inserted.
    const patch = {insertText: e.data, isNative}
    onPatch(patch)
  }

  /**
   * On key down.
   *
   * @param {Event} e
   * @param {Object} data
   * @param {State} state
   * @return {State}
   */

  function onKeyDown(e, data, state) {
    debug('onKeyDown', {data})

    switch (data.key) {
      case 'enter':
        return onKeyDownEnter(e, data, state)
      case 'backspace':
        return onKeyDownBackspace(e, data, state)
      case 'delete':
        return onKeyDownDelete(e, data, state)
      case 'y':
        return onKeyDownY(e, data, state)
      case 'z':
        return onKeyDownZ(e, data, state)
    }
  }

  /**
   * On `enter` key down, split the current block in half.
   *
   * @param {Event} e
   * @param {Object} data
   * @param {State} state
   * @return {State}
   */

  function onKeyDownEnter(e, data, state) {
    onPatch({insertEnter: true})
  }

  /**
   * On `backspace` key down, delete backwards.
   *
   * @param {Event} e
   * @param {Object} data
   * @param {State} state
   * @return {State}
   */

  function onKeyDownBackspace(e, data, state) {
    debug('onKeyDownBackspace', {data})

    const {startOffset, startBlock} = state
    const text = startBlock.text
    let numChars

    // Determine how far backwards to delete.
    if (data.isWord) {
      numChars = String.getWordOffsetBackward(text, startOffset)
    } else if (data.isLine) {
      numChars = startOffset
    } else {
      numChars = String.getCharOffsetBackward(text, startOffset)
    }

    onPatch({remove: numChars, range: state.selection.toJS()})
  }

  /**
   * On `delete` key down, delete forwards.
   *
   * @param {Event} e
   * @param {Object} data
   * @param {State} state
   * @return {State}
   */

  function onKeyDownDelete(e, data, state) {
    debug('onKeyDownDelete', {data})

    // If expanded, delete regularly.
    if (state.isExpanded) {
      return state
        .transform()
        .delete()
        .apply()
    }

    const {startOffset, startBlock} = state
    const text = startBlock.text
    let n

    // Determine how far forwards to delete.
    if (data.isWord) {
      n = String.getWordOffsetForward(text, startOffset)
    }

    else if (data.isLine) {
      n = text.length - startOffset
    }

    else {
      n = String.getCharOffsetForward(text, startOffset)
    }

    return state
      .transform()
      .deleteForward(n)
      .apply()
  }

  /**
   * On select.
   *
   * @param {Event} e
   * @param {Object} data
   * @param {State} state
   * @return {State}
   */

  function onSelect(e, data, state) {
    const {selection} = data

    debug('onSelect', {data, selection: selection.toJS()})

    onPatch({
      localState: state
        .transform()
        .moveTo(selection)
        .focus()
        .apply()
    })
  }

  /**
   * A default schema rule to render block nodes.
   *
   * @type {Object}
   */

  const BLOCK_RENDER_RULE = {
    match: node => {
      return node.kind == 'block'
    },
    render: props => {
      return (
        <div {...props.attributes} style={{position: 'relative'}}>
          {props.children}
          {placeholder && (
            <Placeholder
              className={placeholderClassName}
              node={props.node}
              parent={props.state.document}
              state={props.state}
              style={placeholderStyle}
            >
              {placeholder}
            </Placeholder>
          )}
        </div>
      )
    }
  }

  /**
   * A default schema rule to render inline nodes.
   *
   * @type {Object}
   */

  const INLINE_RENDER_RULE = {
    match: node => {
      return node.kind == 'inline'
    },
    render: props => {
      return (
        <span {...props.attributes} style={{position: 'relative'}}>
          {props.children}
        </span>
      )
    }
  }

  /**
   * A default schema rule to only allow block nodes in documents.
   *
   * @type {Object}
   */

  const DOCUMENT_CHILDREN_RULE = {
    match: node => {
      return node.kind == 'document'
    },
    validate: document => {
      const {nodes} = document
      const invalids = nodes.filter(n => n.kind != 'block')
      return invalids.size ? invalids : null
    },
    normalize: (transform, document, invalids) => {
      return invalids.reduce((t, n) => t.removeNodeByKey(n.key), transform)
    }
  }

  /**
   * A default schema rule to only allow block, inline and text nodes in blocks.
   *
   * @type {Object}
   */

  const BLOCK_CHILDREN_RULE = {
    match: node => {
      return node.kind == 'block'
    },
    validate: block => {
      const {nodes} = block
      const invalids = nodes.filter(n => n.kind != 'block' && n.kind != 'inline' && n.kind != 'text')
      return invalids.size ? invalids : null
    },
    normalize: (transform, block, invalids) => {
      return invalids.reduce((t, n) => t.removeNodeByKey(n.key), transform)
    }
  }

  /**
   * A default schema rule to only allow inline and text nodes in inlines.
   *
   * @type {Object}
   */

  const INLINE_CHILDREN_RULE = {
    match: object => {
      return object.kind == 'inline'
    },
    validate: inline => {
      const {nodes} = inline
      const invalids = nodes.filter(n => n.kind != 'inline' && n.kind != 'text')
      return invalids.size ? invalids : null
    },
    normalize: (transform, inline, invalids) => {
      return invalids.reduce((t, n) => t.removeNodeByKey(n.key), transform)
    }
  }

  /**
   * The default schema.
   *
   * @type {Object}
   */

  const schema = {
    rules: [
      BLOCK_RENDER_RULE,
      INLINE_RENDER_RULE,
      DOCUMENT_CHILDREN_RULE,
      BLOCK_CHILDREN_RULE,
      INLINE_CHILDREN_RULE,
    ]
  }

  /**
   * Return the core plugin.
   */

  return {
    onBeforeChange,
    onBeforeInput,
    onKeyDown,
    onSelect,
    schema,
  }
}
