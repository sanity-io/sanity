import {EditorSelection} from '@sanity/portable-text-editor'
import * as PathUtils from '@sanity/util/paths'

interface OffsetStringPath {
  offset: number
  stringPath: string
}

interface OffsetSelection {
  anchor: OffsetStringPath
  focus: OffsetStringPath
}

interface CurrentSelectionIsOverlappingWithCommentProps {
  currentSelection?: EditorSelection
  addedCommentsSelections?: EditorSelection[]
}

function mapSelectionToOffset(selection?: EditorSelection): OffsetSelection {
  if (!selection) {
    return {
      anchor: {offset: 0, stringPath: ''},
      focus: {offset: 0, stringPath: ''},
    }
  }

  const anchor = {
    offset: selection.anchor.offset || 0,
    stringPath: PathUtils.toString(selection.anchor.path || []),
  }

  const focus = {
    offset: selection.focus.offset || 0,
    stringPath: PathUtils.toString(selection.focus.path || []),
  }

  // Swap anchor and focus if focus is greater than anchor
  return focus.offset < anchor.offset ? {anchor: focus, focus: anchor} : {anchor, focus}
}

function isSelectionInside(
  commentSelection: OffsetSelection,
  compareValue: OffsetSelection,
): boolean {
  return (
    (compareValue.anchor.offset > commentSelection.anchor.offset &&
      compareValue.anchor.offset < commentSelection.focus.offset) ||
    (compareValue.focus.offset > commentSelection.anchor.offset &&
      compareValue.focus.offset < commentSelection.focus.offset)
  )
}

export function currentSelectionIsOverlappingWithComment(
  props: CurrentSelectionIsOverlappingWithCommentProps,
): boolean {
  const {currentSelection, addedCommentsSelections = []} = props

  const compareValue = mapSelectionToOffset(currentSelection)

  const commentSelections = addedCommentsSelections?.map(mapSelectionToOffset) || []

  const overlaps = commentSelections.some((commentSelection) => {
    const isInside = isSelectionInside(commentSelection, compareValue)
    const envelops =
      compareValue.anchor.offset < commentSelection.anchor.offset &&
      compareValue.focus.offset > commentSelection.focus.offset
    const wrapsAround =
      (compareValue.anchor.offset < commentSelection.anchor.offset &&
        compareValue.focus.offset > commentSelection.anchor.offset) ||
      (compareValue.anchor.offset < commentSelection.focus.offset &&
        compareValue.focus.offset > commentSelection.focus.offset)

    return isInside || envelops || wrapsAround
  })

  return overlaps
}
