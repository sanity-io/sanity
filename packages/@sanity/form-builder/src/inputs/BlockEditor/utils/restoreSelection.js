// @flow
import {Operation, Range} from 'slate'
import type {SlateChange, Patch, SlateValue, FormBuilderValue} from '../typeDefs'
import calculateNewOffset from './calculateNewOffset'

function adjustRange(range, value) {
  range.focus.path = [range.focus.path[0] + value, ...range.focus.path.slice(1)]
  range.anchor.path = [range.anchor.path[0] + value, ...range.anchor.path.slice(1)]
}

export default function restoreSelection(
  change: SlateChange,
  select: Operation,
  patches: Patch[],
  snapshot: FormBuilderValue[],
  editorValue: SlateValue // The editor state before changed by incoming patches
) {
  const range = {
    focus: select.properties.focus.toJSON(),
    anchor: select.properties.anchor.toJSON()
  }

  const {focusBlock} = editorValue

  if (focusBlock) {
    const remoteInsertAndUnsetPatches = patches.filter(
      patch =>
        ['insert', 'unset'].includes(patch.type) &&
        patch.path.length === 1 &&
        patch.origin === 'remote'
    )

    let focusBlockIndex = editorValue.document.nodes.findIndex(blk => blk.key === focusBlock.key)
    // console.log('focusBlockIndex', focusBlockIndex)

    remoteInsertAndUnsetPatches.forEach(patch => {
      // console.log(patch)
      if (patch.type === 'insert' && patch.items[0]._key !== focusBlock.key) {
        const insertedBlockIndex = editorValue.document.nodes.findIndex(
          blk => blk.key === patch.path[0]._key
        )
        if (
          insertedBlockIndex < focusBlockIndex ||
          (insertedBlockIndex === focusBlockIndex && patch.position === 'before')
        ) {
          focusBlockIndex += patch.items.length
          // console.log(`adjusting +${patch.items.length}`, focusBlockIndex)
          adjustRange(range, patch.items.length)
        }
      }
      if (patch.type === 'unset' && patch.path[0]._key !== focusBlock.key) {
        const removedBlockIndex = editorValue.document.nodes.findIndex(
          blk => blk.key === patch.path[0]._key
        )
        // console.log('unset', removedBlockIndex, focusBlockIndex)
        if (removedBlockIndex < focusBlockIndex) {
          focusBlockIndex--
          // console.log('adjusting -1', focusBlockIndex)
          adjustRange(range, -1)
        }
      }
    })
  }

  // Base selection
  change.select(Range.fromJSON(range))

  // We might need to move the focus offset if any of the patches involves the selected content
  const focusTextKey = select.value.focusText && select.value.focusText.key
  const patchBlockKeys =
    focusTextKey && patches.map(patch => patch.path[0] && patch.path[0]._key).filter(Boolean)
  const isSameText = patchBlockKeys && patchBlockKeys.some(key => focusTextKey.indexOf(key) > -1)
  if (isSameText) {
    const currentOffset = select.properties.focus.offset
    const calculatedOffset = calculateNewOffset(
      select.value.focusText.text,
      change.value.focusText.text,
      currentOffset
    )
    if (calculatedOffset !== 0) {
      const moveOffset = currentOffset + calculatedOffset
      change.moveTo(moveOffset)
    }
  }

  return change
}
