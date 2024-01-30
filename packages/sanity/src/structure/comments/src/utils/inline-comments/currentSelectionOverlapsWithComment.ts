import {EditorSelection} from '@sanity/portable-text-editor'
import * as PathUtils from '@sanity/util/paths'

interface CurrentSelectionIsOverlappingWithCommentProps {
  currentSelection?: EditorSelection
  addedCommentsSelections?: EditorSelection[]
}

export function currentSelectionIsOverlappingWithComment(
  props: CurrentSelectionIsOverlappingWithCommentProps,
): boolean {
  const {currentSelection, addedCommentsSelections = []} = props

  const compareValue = {
    anchor: {
      offset: currentSelection?.anchor.offset || 0,
      stringPath: PathUtils.toString(currentSelection?.anchor.path || []),
    },
    focus: {
      offset: currentSelection?.focus.offset || 0,
      stringPath: PathUtils.toString(currentSelection?.focus.path || []),
    },
  }

  const commentSelections = addedCommentsSelections?.map((selection) => {
    return {
      anchor: {
        offset: selection?.anchor.offset || 0,
        stringPath: PathUtils.toString(selection?.anchor.path || []),
      },
      focus: {
        offset: selection?.focus.offset || 0,
        stringPath: PathUtils.toString(selection?.focus.path || []),
      },
    }
  })

  const overlaps = commentSelections?.some((commentSelection) => {
    const val =
      // Check if the current selection's anchor is inside the comment selection
      (compareValue.anchor.offset > commentSelection.anchor.offset &&
        compareValue.anchor.offset < commentSelection.focus.offset) ||
      // Check if the current selection's focus is inside the comment selection
      (compareValue.focus.offset > commentSelection.anchor.offset &&
        compareValue.focus.offset < commentSelection.focus.offset) ||
      // Check if the current selection completely envelops the comment selection
      (compareValue.anchor.offset < commentSelection.anchor.offset &&
        compareValue.focus.offset > commentSelection.focus.offset) ||
      // Check if the current selection wraps around the comment selection
      (compareValue.anchor.offset < commentSelection.anchor.offset &&
        compareValue.focus.offset > commentSelection.anchor.offset) ||
      (compareValue.anchor.offset < commentSelection.focus.offset &&
        compareValue.focus.offset > commentSelection.focus.offset)

    return val && compareValue.anchor.stringPath === commentSelection.anchor.stringPath
  })

  return overlaps
}
