import {Editor, Element, Range} from 'slate'
import {EditorSelection} from '..'

// Is the editor currently receiving remote changes that are being applied to the content?
export const IS_PROCESSING_REMOTE_CHANGES: WeakMap<Editor, boolean> = new WeakMap()
// Is the editor currently producing local changes that are not yet submitted?
export const IS_PROCESSING_LOCAL_CHANGES: WeakMap<Editor, boolean> = new WeakMap()

// Is the editor dragging something?
export const IS_DRAGGING: WeakMap<Editor, boolean> = new WeakMap()
// Is the editor dragging a element?
export const IS_DRAGGING_BLOCK_ELEMENT: WeakMap<Editor, Element> = new WeakMap()

// When dragging elements, this will be the target element
export const IS_DRAGGING_ELEMENT_TARGET: WeakMap<Editor, Element> = new WeakMap()
// Target position for dragging over a block
export const IS_DRAGGING_BLOCK_TARGET_POSITION: WeakMap<Editor, 'top' | 'bottom'> = new WeakMap()

export const KEY_TO_SLATE_ELEMENT: WeakMap<Editor, any | undefined> = new WeakMap()
export const KEY_TO_VALUE_ELEMENT: WeakMap<Editor, any | undefined> = new WeakMap()

// Keep object relation to slate range in the portable-text-range
export const SLATE_TO_PORTABLE_TEXT_RANGE = new WeakMap<Range, EditorSelection>()
