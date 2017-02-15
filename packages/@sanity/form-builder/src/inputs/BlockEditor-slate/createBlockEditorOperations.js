import {
  SLATE_LINK_TYPE,
  SLATE_DEFAULT_STYLE
} from './constants'

export default function createBlockEditorOperations(blockEditor) {

  return {

    createLink() {

      const {value, onChange} = blockEditor.props
      const {selection, focusKey, document} = value

      let transform = value.transform()

      const addItemValue = blockEditor.context.formBuilder
        .createFieldValue(undefined, blockEditor.linkType)
      const link = {
        type: SLATE_LINK_TYPE,
        isVoid: false,
        kind: 'inline',
        data: {
          value: addItemValue
        }
      }
      if (value.isExpanded) {
        transform = transform
          .unwrapInline(SLATE_LINK_TYPE)
          .wrapInline(link)
          .focus()
      } else {
        const focusNode = document.getClosestBlock(focusKey)
        if (focusNode && focusNode.isVoid) {
          return
        }
        transform = transform
          .focus()
          .splitInlineAtRange(selection)
          .collapseToStart()
          .splitInline()
          .collapseToEnd()
      }
      const nextState = transform.apply()
      onChange(nextState)
    },

    removeLink() {
      const {value, onChange} = blockEditor.props
      let transform = value.transform()
      transform = transform
        .unwrapInline(SLATE_LINK_TYPE)
        .focus()
      const nextState = transform.apply()
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
        data: {listItem: listItemName}
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
      const block = {
        type: 'contentBlock',
        data: {style: styleName}
      }
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
          transform
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
      transform
        .setBlock(block)
      const nextState = transform.apply()
      onChange(nextState)
    },

    insertItem(item) {
      const {value, onChange} = blockEditor.props
      const addItemValue = blockEditor.context.formBuilder.createFieldValue(undefined, item)
      const props = {
        type: item.type.name,
        isVoid: true,
        data: {
          value: addItemValue
        }
      }
      let transform = value.transform()
      if (item.options && item.options.inline) {
        transform = transform.insertInline(props)
      } else {
        transform = transform.insertBlock(props)
      }
      const nextState = transform.apply()

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
