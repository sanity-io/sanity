function onKeyDown(event, data, change) {
  if (data.key !== 'tab') {
    return null
  }
  const state = change.state
  const listBlocks = state.blocks.filter(block => block.data.get('listItem'))
  if (listBlocks.size === 0) {
    return null
  }
  event.preventDefault()
  listBlocks.forEach(listNode => {
    const listItemData = listNode.data.toObject()
    listItemData.level = listItemData.level || 1
    if (data.isShift) {
      listItemData.level--
      listItemData.level = listItemData.level || 1 // Min level 1
    } else {
      listItemData.level++
      listItemData.level = listItemData.level < 11 ? listItemData.level : 10 // Max level 10
    }
    change.setNodeByKey(listNode.key, {data: listItemData})
  })
  return change
}

export default () => {
  return {onKeyDown}
}
