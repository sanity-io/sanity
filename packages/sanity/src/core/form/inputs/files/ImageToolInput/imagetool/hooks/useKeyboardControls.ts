import {useCallback, useRef} from 'react'

import {
  DEFAULT_CROP,
  DEFAULT_HOTSPOT,
  KEYBOARD_CHANGE_SAVE_DEBOUNCE_MS,
  KEYBOARD_MOVEMENT_STEP,
  KEYBOARD_RESIZE_STEP,
  KEYBOARD_SHIFT_MULTIPLIER,
} from '../constants'
import {
  type Crop,
  type CropAndHotspot,
  type Hotspot,
  type Rect,
  type ToolHandleType,
  type ToolInteractionTarget,
} from '../types'
import {
  applyHotspotMoveBy,
  handleCropHandleResize,
  handleCropMove,
  handleHotspotResize,
} from '../utils'

interface UseKeyboardControlsProps {
  value: Partial<CropAndHotspot>
  onChange: (value: CropAndHotspot) => void
  onChangeEnd: (value: CropAndHotspot) => void
  innerRect: Rect
  focusTarget: ToolInteractionTarget | null
  readOnly: boolean
}

export function useKeyboardControls({
  value,
  onChange,
  onChangeEnd,
  innerRect,
  focusTarget,
  readOnly,
}: UseKeyboardControlsProps) {
  const initialCropRef = useRef<Crop | null>(null)
  const initialHotspotRef = useRef<Hotspot | null>(null)
  const initialCursorRef = useRef<{x: number; y: number} | null>(null)
  const changeEndTimeoutRef = useRef<number | null>(null)

  // Function to trigger the onChangeEnd call
  const triggerChangeEnd = useCallback(() => {
    if (initialCropRef.current || initialHotspotRef.current) {
      onChangeEnd({
        crop: value.crop || DEFAULT_CROP,
        hotspot: value.hotspot || DEFAULT_HOTSPOT,
      })

      initialCropRef.current = null
      initialHotspotRef.current = null
      initialCursorRef.current = null
    }
  }, [onChangeEnd, value])

  // Handle hotspot keyboard interactions
  const handleHotspotKeyDown = useCallback(
    (params: {
      e: {key: string}
      crop: Crop
      hotspot: Hotspot
      isCtrlOrCmdPressed: boolean
      step: number
      resizeStep: number
    }): CropAndHotspot | null => {
      const {e, crop, hotspot, isCtrlOrCmdPressed, step, resizeStep} = params
      let newValue: CropAndHotspot | null = null

      if (isCtrlOrCmdPressed) {
        // Resize hotspot with arrow keys when Ctrl/Cmd is pressed
        const pointerPos = {
          x: initialCursorRef.current!.x,
          y: initialCursorRef.current!.y,
        }

        switch (e.key) {
          case 'ArrowUp': // Larger height
            pointerPos.y -= innerRect.height * resizeStep
            break
          case 'ArrowDown': // Smaller height
            pointerPos.y += innerRect.height * resizeStep
            break
          case 'ArrowLeft': // Smaller width
            pointerPos.x -= innerRect.width * resizeStep
            break
          case 'ArrowRight': // Larger width
            pointerPos.x += innerRect.width * resizeStep
            break
          default:
            return null
        }

        newValue = handleHotspotResize({
          initialHotspot: hotspot,
          crop,
          initialCursor: initialCursorRef.current!,
          pointerPos,
          innerRect,
        })
      } else {
        // Move hotspot with arrow keys
        const delta = {x: 0, y: 0}

        switch (e.key) {
          case 'ArrowUp':
            delta.y = -step
            break
          case 'ArrowDown':
            delta.y = step
            break
          case 'ArrowLeft':
            delta.x = -step
            break
          case 'ArrowRight':
            delta.x = step
            break
          default:
            return null
        }

        newValue = {
          hotspot: applyHotspotMoveBy({hotspot, crop}, delta),
          crop,
        }
      }

      return newValue
    },
    [innerRect],
  )

  // Handle crop keyboard interactions
  const handleCropKeyDown = useCallback(
    (params: {
      e: {key: string}
      crop: Crop
      hotspot: Hotspot
      isCtrlOrCmdPressed: boolean
      step: number
      resizeStep: number
    }): CropAndHotspot | null => {
      const {e, crop, hotspot, isCtrlOrCmdPressed, step, resizeStep} = params

      if (isCtrlOrCmdPressed) {
        // Resize crop
        let activeHandle: ToolHandleType | null = null
        const pointerPos = {
          x: initialCursorRef.current!.x,
          y: initialCursorRef.current!.y,
        }

        switch (e.key) {
          case 'ArrowUp': // Shrink height from bottom
            activeHandle = 'crop-bottom'
            pointerPos.y -= innerRect.height * resizeStep
            break
          case 'ArrowDown': // Increase height from bottom
            activeHandle = 'crop-bottom'
            pointerPos.y += innerRect.height * resizeStep
            break
          case 'ArrowLeft': // Shrink width from right
            activeHandle = 'crop-right'
            pointerPos.x -= innerRect.width * resizeStep
            break
          case 'ArrowRight': // Increase width from right
            activeHandle = 'crop-right'
            pointerPos.x += innerRect.width * resizeStep
            break
          default:
            return null
        }

        if (activeHandle) {
          return handleCropHandleResize({
            initialCrop: crop,
            initialHotspot: hotspot,
            initialCursor: initialCursorRef.current!,
            pointerPos,
            innerRect,
            activeHandle,
          })
        }
      } else {
        // Move crop
        const pointerPos = {
          x: initialCursorRef.current!.x,
          y: initialCursorRef.current!.y,
        }

        switch (e.key) {
          case 'ArrowUp':
            pointerPos.y -= innerRect.height * step
            break
          case 'ArrowDown':
            pointerPos.y += innerRect.height * step
            break
          case 'ArrowLeft':
            pointerPos.x -= innerRect.width * step
            break
          case 'ArrowRight':
            pointerPos.x += innerRect.width * step
            break
          default:
            return null
        }

        return handleCropMove({
          initialCrop: crop,
          initialHotspot: hotspot,
          initialCursor: initialCursorRef.current!,
          pointerPos,
          innerRect,
        })
      }

      return null
    },
    [innerRect],
  )

  // Main keydown handler for React components
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Clear any existing timeout
      if (changeEndTimeoutRef.current !== null) {
        window.clearTimeout(changeEndTimeoutRef.current)
      }

      if (readOnly || !focusTarget) return

      // Only proceed if it's an arrow key
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        return
      }

      const crop = value.crop || DEFAULT_CROP
      const hotspot = value.hotspot || DEFAULT_HOTSPOT

      // Initialize references with current values
      initialCropRef.current = {...crop}
      initialHotspotRef.current = {...hotspot}
      initialCursorRef.current = {
        x: innerRect.width / 2,
        y: innerRect.height / 2,
      }

      const isShiftPressed = e.shiftKey
      const isCtrlOrCmdPressed = e.ctrlKey || e.metaKey
      const step = isShiftPressed
        ? KEYBOARD_MOVEMENT_STEP * KEYBOARD_SHIFT_MULTIPLIER
        : KEYBOARD_MOVEMENT_STEP
      const resizeStep = isShiftPressed
        ? KEYBOARD_RESIZE_STEP * KEYBOARD_SHIFT_MULTIPLIER
        : KEYBOARD_RESIZE_STEP

      let newValue: CropAndHotspot | null = null

      // Route to the appropriate handler based on focus target
      if (focusTarget === 'hotspot' || focusTarget === 'hotspotHandle') {
        newValue = handleHotspotKeyDown({
          e,
          crop,
          hotspot,
          isCtrlOrCmdPressed,
          step,
          resizeStep,
        })
      } else if (focusTarget === 'crop' || focusTarget === 'cropHandle') {
        newValue = handleCropKeyDown({
          e,
          crop,
          hotspot,
          isCtrlOrCmdPressed,
          step,
          resizeStep,
        })
      }

      // Apply changes if a new value was calculated
      if (newValue) {
        onChange(newValue)
        e.preventDefault()
      }
    },
    [
      value,
      onChange,
      focusTarget,
      readOnly,
      innerRect,
      handleHotspotKeyDown,
      handleCropKeyDown,
      changeEndTimeoutRef,
    ],
  )

  // Handle key up - schedule a debounced onChangeEnd call
  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent) => {
      // Clear any existing timeout
      if (changeEndTimeoutRef.current !== null) {
        window.clearTimeout(changeEndTimeoutRef.current)
      }

      // Schedule a new debounced call
      changeEndTimeoutRef.current = window.setTimeout(() => {
        triggerChangeEnd()
        changeEndTimeoutRef.current = null
      }, KEYBOARD_CHANGE_SAVE_DEBOUNCE_MS)
    },
    [triggerChangeEnd],
  )

  return {
    handleKeyDown,
    handleKeyUp,
  }
}
