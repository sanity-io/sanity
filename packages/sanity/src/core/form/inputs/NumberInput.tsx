import {TextInput} from '@sanity/ui'
import {useEffect} from 'react'

import type {NumberInputProps} from '../types/inputProps'
import {getValidationRule} from '../utils/getValidationRule'

function getScrollableParent(node: EventTarget) {
  if (!node || !(node instanceof Element)) return null

  let parent = node.parentElement

  while (parent) {
    const style = window.getComputedStyle(parent)
    const overflowY = style.overflowY
    const isScrollable = overflowY === 'auto' || overflowY === 'scroll'
    if (isScrollable && parent.scrollHeight > parent.clientHeight) {
      return parent
    }
    parent = parent.parentElement
  }

  return window
}

// Workaround for wheel-events causing number inputs to mutate
//
// The mere presence of an event listener for the wheel event causes number inputs to mutate on wheel.
// This is terrible UX and can lead to accidental modifications of values that can go unnoticed.
// The below event handler provides a workaround for Chromium-based browsers.
// Firefox has removed mutate-on-wheel behavior
// Safari has removed it as of current Technology Preview, but this workaround, however, does not fix
// the issue for current Safari versions
// See https://github.com/facebook/react/issues/32156
function preventWheel(event: WheelEvent) {
  if (event.currentTarget && document.activeElement === event.currentTarget) {
    event.preventDefault()
    const scrollContainer = getScrollableParent(event.currentTarget)
    if (scrollContainer) {
      // The above preventDefault also prevents scrolling, but we still want the wheel event to actually scroll
      // so we'll instead explicitly call scrollBy on the nearest scroll container
      // ## Note about Safari
      // Testing in Safari 18.1.1 reveals that this call to .scrollBy actually brings back the mutate-on-scroll
      // behavior and triggers an onChange on the input ending up voiding the workaround here, meaning
      // mutate-on-wheel behavior will still be an issue in Safari. It's unclear to me why this happens.
      // However, since WebKit has removed mutate-on-wheel behavior, this will cease to be an issue in a future release of Safari.
      scrollContainer.scrollBy({
        top: event.deltaY,
        left: event.deltaX,
        behavior: 'instant',
      })
    }
  }
}
/**
 *
 * @hidden
 * @beta
 */
export function NumberInput(props: NumberInputProps) {
  const {schemaType, validationError, elementProps} = props

  // Show numpad on mobile if only positive numbers is preferred
  const minRule = getValidationRule(schemaType, 'min')
  const integerRule = getValidationRule(schemaType, 'integer')
  const precisionRule = getValidationRule(schemaType, 'precision')
  const onlyPositiveNumber = typeof minRule?.constraint === 'number' && minRule?.constraint >= 0
  const onlyIntegers = integerRule || precisionRule?.constraint === 0

  const inputMode = onlyPositiveNumber ? (onlyIntegers ? 'numeric' : 'decimal') : 'text'

  const inputElementRef = elementProps.ref

  useEffect(() => {
    const element = inputElementRef.current
    element.addEventListener('wheel', preventWheel)
    return () => {
      element.removeEventListener('wheel', preventWheel)
    }
  }, [inputElementRef])

  return (
    <TextInput
      {...elementProps}
      type="number"
      step="any"
      inputMode={inputMode}
      customValidity={validationError}
      placeholder={schemaType.placeholder}
      pattern={onlyPositiveNumber ? '[d]*' : undefined}
      max={Number.MAX_SAFE_INTEGER}
      min={Number.MIN_SAFE_INTEGER}
      data-testid="number-input"
    />
  )
}
