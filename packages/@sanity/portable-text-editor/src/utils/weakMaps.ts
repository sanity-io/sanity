import {Editor, Element, Range, Text} from 'slate'
import {EditorSelection} from '..'

/**
 * Dragging
 */

// Is the editor dragging something?
export const IS_DRAGGING: WeakMap<Editor, boolean> = new WeakMap()
// Is the editor dragging a element?
export const IS_DRAGGING_BLOCK_ELEMENT: WeakMap<Editor, Element> = new WeakMap()
export const IS_DRAGGING_CHILD_ELEMENT: WeakMap<Editor, Element | Text> = new WeakMap()
// When dragging elements, this will be the target element
export const IS_DRAGGING_ELEMENT_TARGET: WeakMap<Editor, Element> = new WeakMap()
export const IS_DRAGGING_ELEMENT_RANGE: WeakMap<Editor, Range> = new WeakMap()
// Target position for dragging over a block
export const IS_DRAGGING_BLOCK_TARGET_POSITION: WeakMap<Editor, 'top' | 'bottom'> = new WeakMap()

export const KEY_TO_SLATE_ELEMENT: WeakMap<Editor, any | undefined> = new WeakMap()
export const KEY_TO_VALUE_ELEMENT: WeakMap<Editor, any | undefined> = new WeakMap()

// Keep object relation to slate range in the portable-text-range
export const SLATE_TO_PORTABLE_TEXT_RANGE = new WeakMap<Range, EditorSelection>()
