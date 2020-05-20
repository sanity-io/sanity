// disable overlay rendring entirely
// this will display presence in fields
export const DISABLE_OVERLAY = false

// number of avatars to display on each fields (will be stacked and have a counter if more than 3 users in a field)
export const MAX_AVATARS = 3

// distance between avatars in pixels (negative number means overlap)
export const AVATAR_DISTANCE = -5

// height/width of the avatars in pixels
export const AVATAR_SIZE = 21

export const AVATAR_ARROW_HEIGHT = 4

// these are the thresholds in which the intersection observers will notify about regions going in/out of viewport
// these will affect the thresholds below, so make sure to coordinate edits
export const INTERSECTION_THRESHOLDS = [0, 0.25, 0.75, 1]

// The elements that reports intersection changes are padded top+bottom in order to detect when entering leaving
export const INTERSECTION_ELEMENT_PADDING = 23

// Make the avatars snap to the top dock when they are closer than this from the top
export const SNAP_TO_DOCK_DISTANCE_TOP = 8

// Make the avatars snap to the bottom dock when they are closer than this from the bottom
export const SNAP_TO_DOCK_DISTANCE_BOTTOM = 8

// The avatar will move to the right when this close (in pixels) to the top
export const SLIDE_RIGHT_THRESHOLD_TOP = 22

// The avatar will move to the right when this close (in pixels) to the bottom
export const SLIDE_RIGHT_THRESHOLD_BOTTOM = 22

// Switch on debug mode (will display regions)
export const DEBUG = false
