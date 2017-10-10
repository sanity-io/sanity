import {BLOCK_DEFAULT_STYLE, SLATE_DEFAULT_BLOCK, SLATE_SPAN_TYPE} from './constants'
import {createProtoValue} from './createProtoValue'
import randomKey from './util/randomKey'

export default function createBlockEditorOperations(blockEditor) {

  function onChange(change) {
    return blockEditor.props.onChange(change)
  }

  function getState() {
    // Work on absolutely current state of the slate editor
    // blockEditor.props.value (state) could potentially be out of sync
    return blockEditor.editor.getState()
  }

  return {

    createFormBuilderSpan(annotationType) {
      const state = getState()
      let change

      if (state.isExpanded) {
        change = state.change()
      } else {
        change = this.expandToFocusedWord(state.change())
        if (!change) {
          return null
        }
      }
      const key = randomKey(12)
      const span = {
        isVoid: false,
        type: SLATE_SPAN_TYPE,
        kind: 'inline',
        data: undefined,
        key: key
      }
      change
        .unwrapInline(SLATE_SPAN_TYPE)
        .wrapInline(span)

      const currentSpan = blockEditor.props.value.inlines
        .filter(inline => inline.key === key)
        .first()

      const data = {
        annotations: currentSpan ? currentSpan.data.get('annotations') || {} : {},
        focusedAnnotationName: annotationType.name
      }
      data.annotations[annotationType.name] = createProtoValue(annotationType, key)

      return onChange(change.setInline({data: data}))
    },

    removeAnnotationFromSpan(spanNode, annotationType) {
      const state = getState()
      const annotations = spanNode.data.get('annotations')
      if (!annotations) {
        return
      }
      // Remove the whole span if this annotation is the only one left
      if (Object.keys(annotations).length === 1 && annotations[annotationType.name]) {
        this.removeSpan(spanNode)
        return
      }
      // If several annotations, remove only this one and leave the node intact
      Object.keys(annotations).forEach(name => {
        if (annotations[name]._type === annotationType.name) {
          delete annotations[name]
        }
      })
      const data = {
        ...spanNode.data.toObject(),
        focusedAnnotationName: undefined,
        annotations: annotations
      }
      const nextChange = state.change()
        .setNodeByKey(spanNode.key, {data})

      onChange(nextChange)
    },

    removeSpan(spanNode) {
      const state = getState()
      let change
      if (Array.isArray(spanNode)) {
        change = state.change()
        spanNode.forEach(node => {
          change = change.unwrapInlineByKey(node.key)
        })
        change = change.focus()
      } else if (spanNode) {
        change = state.change()
          .unwrapInlineByKey(spanNode.key)
          .focus()
      } else {
        // Apply on current selection
        change = state.change()
          .unwrapInline(SLATE_SPAN_TYPE)
          .focus()
      }
      onChange(change)
    },

    toggleListItem(listItemName, isActive) {
      const state = getState()
      const normalBlock = SLATE_DEFAULT_BLOCK
      const listItemBlock = {
        type: 'contentBlock',
        data: {listItem: listItemName, style: BLOCK_DEFAULT_STYLE, level: 1}
      }
      const change = state.change()

      if (isActive) {
        change.setBlock(normalBlock)
      } else {
        change.setBlock(listItemBlock)
      }
      onChange(change.focus())
    },

    setBlockStyle(styleName) {
      const state = getState()
      const {selection, startBlock, endBlock} = state
      let change = state.change()

      // If a single block is selected partially, split block conditionally
      // (selection in start, middle or end of text)
      if (startBlock === endBlock
        && selection.isExpanded
        && !(
          selection.hasStartAtStartOf(startBlock)
          && selection.hasEndAtEndOf(startBlock)
        )) {
        const hasTextBefore = !selection.hasStartAtStartOf(startBlock)
        const hasTextAfter = !selection.hasEndAtEndOf(startBlock)
        if (hasTextAfter) {
          const extendForward = selection.isForward
            ? (selection.focusOffset - selection.anchorOffset)
            : (selection.anchorOffset - selection.focusOffset)
          change
            .collapseToStart()
            .splitBlock()
            .moveForward()
            .extendForward(extendForward)
            .collapseToEnd()
            .splitBlock()
            .collapseToStartOfPreviousText()
        } else if (hasTextBefore) {
          change
            .collapseToStart()
            .splitBlock()
            .moveForward()
        } else {
          change
            .collapseToEnd()
            .splitBlock()
            .select(selection)
        }
      }
      change.focus()

      // Do the actual style transform, only acting on type contentBlock
      state.blocks.forEach(blk => {
        const newData = {...blk.data.toObject(), style: styleName}
        if (blk.type === 'contentBlock') {
          change = change
            .setNodeByKey(blk.key, {data: newData})
        }
      })
      onChange(change.focus())
    },

    insertBlock(type) {
      const state = getState()
      const key = randomKey(12)
      const block = {
        type: type.name,
        isVoid: true,
        key: key,
        data: {
          value: createProtoValue(type, key)
        }
      }
      onChange(state.change().insertBlock(block))
    },

    insertInline(type) {
      const state = getState()
      const key = randomKey(12)
      const props = {
        type: type.name,
        isVoid: true,
        key: key,
        data: {
          value: createProtoValue(type, key)
        }
      }

      onChange(state.change().insertInline(props))
    },

    toggleMark(mark) {
      onChange(getState()
        .change()
        .toggleMark(mark.type)
        .focus())
    },

    expandToFocusedWord(change) {
      const {focusText, focusOffset} = change.state
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
      return change
        .moveOffsetsTo(newStartOffset, newEndOffset)
        .focus()
    },

    expandToNode(node) {
      return getState().change()
        .moveToRangeOf(node)
        .focus()
    }

  }
}
