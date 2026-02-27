import {type Crop, type Hotspot} from './types'

export const DEFAULT_HOTSPOT: Hotspot = {
  x: 0.5,
  y: 0.5,
  height: 1,
  width: 1,
}

export const DEFAULT_CROP: Crop = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
}

export const HANDLE_VISUAL_SIZE_HOTSPOT = 16
export const HANDLE_VISUAL_SIZE_CROP = 8
export const HANDLE_INTERACTIVE_SIZE = 24

// Ensure we have enough space for the handles to be interactive
export const MARGIN_SIZE = HANDLE_INTERACTIVE_SIZE / 2

// Prevent resizing the crop to less than 5% of the image size
export const MIN_CROP_SIZE = 0.05

// Keyboard control constants
export const KEYBOARD_MOVEMENT_STEP = 0.005 // 0.5% of the image size
export const KEYBOARD_RESIZE_STEP = 0.005 // 0.5% of the image size
export const KEYBOARD_SHIFT_MULTIPLIER = 5 // 5x faster movement/resizing when holding shift
export const KEYBOARD_CHANGE_SAVE_DEBOUNCE_MS = 300 // how long to wait before saving keyboard changes
