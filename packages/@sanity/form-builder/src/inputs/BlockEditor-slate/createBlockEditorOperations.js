import {SLATE_DEFAULT_STYLE, SLATE_SPAN_TYPE} from './constants'
import {getSpanField} from './util/spanHelpers'

export default function createBlockEditorOperations(blockEditor) {

  return {

    createFormBuilderSpan() {

      const {value, onChange} = blockEditor.props

      if (!value.isExpanded) {
        throw new Error('todo: decide if we should expand selection before applying')
      }

      const spanField = getSpanField(blockEditor.props.type)
      const addItemValue = blockEditor.context.formBuilder
        .createFieldValue(undefined, spanField.type)

      const span = {
        isVoid: false, // todo: make void if schema says so
        type: SLATE_SPAN_TYPE,
        kind: 'inline',
        data: {
          value: addItemValue
        }
      }

      const nextState = value.transform()
        .unwrapInline(SLATE_SPAN_TYPE)
        .wrapInline(span)
        .focus()
        .apply()

      onChange(nextState)
    },

    removeSpan() {
      const {value, onChange} = blockEditor.props
      const nextState = value.transform()
        .unwrapInline(SLATE_SPAN_TYPE)
        .focus()
        .apply()
      onChange(nextState)
    },

    toggleListItem(listItemName, isActive) {
      const {value, onChange} = blockEditor.props
      const normalBlock = {
        type: 'contentBlock',
        data: {style: SLATE_DEFAULT_STYLE}
      }
      const listItemBlock = {
        type: 'contentBlock',
        data: {listItem: listItemName, style: SLATE_DEFAULT_STYLE}
      }
      let transform = value.transform()

      if (isActive) {
        transform = transform
          .setBlock(normalBlock)
      } else {
        transform = transform
          .setBlock(listItemBlock)
      }
      const nextState = transform.apply()
      onChange(nextState)
    },

    setBlockStyle(styleName) {
      const {value, onChange} = blockEditor.props
      const {selection, startBlock, endBlock} = value
      let transform = value.transform()

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
      transform = value.transform()
      value.blocks.forEach(blk => {
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
      const {value, onChange} = blockEditor.props
      const addItemValue = blockEditor.context.formBuilder.createFieldValue(undefined, item)

      const props = {
        type: item.type.name,
        isVoid: true,
        data: {value: addItemValue}
      }

      const nextState = value.transform().insertBlock(props).apply()
      onChange(nextState)
    },

    toggleMark(mark) {
      const {value, onChange} = blockEditor.props
      const nextState = value
        .transform()
        .toggleMark(mark.type)
        .apply()
      onChange(nextState)
    }

  }
}
