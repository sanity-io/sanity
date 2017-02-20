import {SLATE_DEFAULT_STYLE, SLATE_SPAN_TYPE} from './constants'
import {getSpanType} from './util/spanHelpers'

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

      const nextState = transform
        .unwrapInline(SLATE_SPAN_TYPE)
        .wrapInline(span)
        .focus()
        .apply()


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


      // Create empty value
      const spanValue = blockEditor.context.formBuilder
        .createFieldValue(undefined, spanField.type)


      // Update the span with new data
      const finalState = nextState.transform()
        .setInline({data: {value: spanValue}})
        .apply()

      return onChange(finalState)
    },

    resetSpan(spanNode) {
      const state = getState()
      const spanField = getSpanType(blockEditor.props.type)
      const spanValue = blockEditor.context.formBuilder
        .createFieldValue(undefined, spanField.type)
      const data = {value: spanValue}
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
              .moveTo(selection)
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
      const addItemValue = blockEditor.context.formBuilder.createFieldValue(undefined, item)

      const props = {
        type: item.type.name,
        isVoid: true,
        data: {value: addItemValue}
      }

      const nextState = state.transform().insertBlock(props).apply()
      onChange(nextState)
    },

    toggleMark(mark) {
      const state = getState()
      const nextState = state
        .transform()
        .toggleMark(mark.type)
        .apply()
      onChange(nextState)
    },

    expandToFocusedWord() {
      const state = getState()
      const {startText, focusOffset} = state
      const text = startText.text

      const newAnchorOffset = text.substring(0, focusOffset).lastIndexOf(' ') + 1
      const newFocusOffset = focusOffset
        + text.substring(focusOffset, text.length).split(' ')[0].length

      // Not near any word, abort
      if (newAnchorOffset === newFocusOffset) {
        return null
      }

      // Select and highlight current word
      // Note: don't call apply and onChange here
      return state.transform()
        .moveToOffsets(newAnchorOffset, newFocusOffset)
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
