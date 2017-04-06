import {SLATE_DEFAULT_STYLE, SLATE_SPAN_TYPE} from './constants'
import {getSpanType} from './util/spanHelpers'
import {createProtoValue} from './createProtoValue'

export default function createBlockEditorOperations(blockEditor) {

  function onChange(nextState) {
    return blockEditor.props.onChange(nextState)
  }

  function getState() {
    // Work on absolutely current state of the slate editor
    // blockEditor.props.value (state) could potentially be out of sync
    return blockEditor.editor.getState()
  }

  const span = {
    isVoid: false, // todo: make void if schema says so
    type: SLATE_SPAN_TYPE,
    kind: 'inline',
    data: {value: undefined}
  }


  return {

    createFormBuilderSpan() {
      const state = getState()
      const {startOffset} = state

      const spanField = getSpanType(blockEditor.props.type)

      let transform

      if (state.isExpanded) {
        transform = state.transform()
      } else {
        transform = this.expandToFocusedWord()
        if (!transform) {
          // No word to expand to
          return null
        }
      }

      transform = transform
        .unwrapInline(SLATE_SPAN_TYPE)
        .wrapInline(span)

      // There is a bug (in Slate?) where if you
      // select the first word in a block and try to
      // make a link of it, at this point, it says
      // that the range is not in the document
      // Move the selection back to the initial selection
      if (startOffset === 0 && state.isExpanded) {
        transform = transform.select(state.selection)
      }

      // IDEA: get selected text and set it on the data
      // could be used to searching etc in the dialogue

      // // Get text of applied new selection
      // const selecetedText = nextState
      //   .startText
      //   .text
      //   .substring(
      //     nextState.selection.anchorOffset,
      //     nextState.selection.focusOffset
      //   )

      // const spanValue = blockEditor.context.formBuilder
      //   .createFieldValue({text: selecetedText}, spanField.type)


      // Update the span with new data
      const finalState = transform
        .setInline({data: {value: createProtoValue(spanField.type)}})
        .apply()

      return onChange(finalState)
    },

    resetSpan(spanNode) {
      const state = getState()
      const spanField = getSpanType(blockEditor.props.type)
      const data = {value: createProtoValue(spanField.type)}
      let nextState
      if (Array.isArray(spanNode)) {
        nextState = state.transform()
        spanNode.forEach(node => {
          nextState = nextState
            .setNodeByKey(spanNode.key, {})
        })
        nextState = nextState.focus()
      } else if (spanNode) {
        nextState = state.transform()
          .setNodeByKey(spanNode.key, {data})
      } else {
        // Apply on current selection
        nextState = state.transform()
          .setInline({data})
      }

      nextState = nextState.focus().apply()
      onChange(nextState)
    },

    removeSpan(spanNode) {
      const state = getState()
      let nextState
      if (Array.isArray(spanNode)) {
        nextState = state.transform()
        spanNode.forEach(node => {
          nextState = nextState.unwrapInlineByKey(node.key)
        })
        nextState = nextState.focus().apply()
      } else if (spanNode) {
        nextState = state.transform()
          .unwrapInlineByKey(spanNode.key)
          .focus()
          .apply()
      } else {
        // Apply on current selection
        nextState = state.transform()
          .unwrapInline(SLATE_SPAN_TYPE)
          .focus()
          .apply()
      }
      onChange(nextState)
    },

    toggleListItem(listItemName, isActive) {
      const state = getState()
      const normalBlock = {
        type: 'contentBlock',
        data: {style: SLATE_DEFAULT_STYLE}
      }
      const listItemBlock = {
        type: 'contentBlock',
        data: {listItem: listItemName, style: SLATE_DEFAULT_STYLE}
      }
      let transform = state.transform()

      if (isActive) {
        transform = transform
          .setBlock(normalBlock)
      } else {
        transform = transform
          .setBlock(listItemBlock)
      }
      const nextState = transform.focus().apply()
      onChange(nextState)
    },

    setBlockStyle(styleName) {
      const state = getState()
      const {selection, startBlock, endBlock} = state
      let transform = state.transform()

      // If a single block is selected partially, split block conditionally
      // (selection in start, middle or end of text)
      if (startBlock === endBlock
        && selection.isExpanded
        && !(
          selection.hasStartAtStartOf(startBlock)
          && selection.hasEndAtEndOf(startBlock
        )
      )) {
        const hasTextBefore = !selection.hasStartAtStartOf(startBlock)
        const hasTextAfter = !selection.hasEndAtEndOf(startBlock)
        if (hasTextAfter) {
          const extendForward = selection.isForward
            ? (selection.focusOffset - selection.anchorOffset)
            : (selection.anchorOffset - selection.focusOffset)
          transform = transform
            .collapseToStart()
            .splitBlock()
            .moveForward()
            .extendForward(extendForward)
            .collapseToEnd()
            .splitBlock()
            .collapseToStartOfPreviousText()
        } else {
          transform = hasTextBefore ? (
            transform
              .collapseToStart()
              .splitBlock()
              .moveForward()
          ) : (
            transform
              .collapseToEnd()
              .splitBlock()
              .select(selection)
          )
        }
      }
      transform.focus().apply()

      // Do the actual style transform, only acting on type contentBlock
      transform = state.transform()
      state.blocks.forEach(blk => {
        const newData = {...blk.data.toObject(), style: styleName}
        if (blk.type === 'contentBlock') {
          transform = transform
            .setNodeByKey(blk.key, {data: newData})
        }
      })
      const nextState = transform.focus().apply()
      onChange(nextState)
    },

    insertBlock(item) {
      const state = getState()

      const props = {
        type: item.type.name,
        isVoid: true,
        data: {
          value: createProtoValue(item.type)
        }
      }

      const nextState = state.transform().insertBlock(props).apply()
      onChange(nextState)
    },

    toggleMark(mark) {
      const state = getState()
      const nextState = state
        .transform()
        .toggleMark(mark.type)
        .focus()
        .apply()
      onChange(nextState)
    },

    expandToFocusedWord() {
      const state = getState()
      const {focusText, focusOffset} = state
      const charsBefore = focusText.characters.slice(0, focusOffset)
      const charsAfter = focusText.characters.slice(focusOffset, -1)
      const isEmpty = obj => obj.get('text').match(/\s/g)
      const whiteSpaceBeforeIndex = charsBefore.reverse().findIndex(obj => isEmpty(obj))

      const newStartOffset = (whiteSpaceBeforeIndex > -1)
        ? (charsBefore.size - whiteSpaceBeforeIndex)
        : -1

      const whiteSpaceAfterIndex = charsAfter.findIndex(obj => isEmpty(obj))
      const newEndOffset = charsBefore.size
          + (whiteSpaceAfterIndex > -1 ? whiteSpaceAfterIndex : (charsAfter.size + 1))

      // Not near any word, abort
      if (newStartOffset === newEndOffset) {
        return null
      }

      // Select and highlight current word
      // Note: don't call apply and onChange here
      return state.transform()
        .moveOffsetsTo(newStartOffset, newEndOffset)
        .focus()
    },

    expandToNode(node) {
      return getState().transform()
        .moveToRangeOf(node)
        .focus()
        .apply()
    }

  }
}
