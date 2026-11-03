import {defineField, defineType, type FormNodeValidation} from '@sanity/types'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {FormFieldValidationStatus} from '../FormFieldValidationStatus'

const MESSAGE = 'Reference to non-existent document "abc123" is not allowed'

const VALIDATION: FormNodeValidation[] = [{level: 'error', message: MESSAGE, path: []}]

const schemaTypes = [
  defineType({
    type: 'document',
    name: 'test',
    fields: [defineField({type: 'string', name: 'title'})],
  }),
]

function Harness() {
  return (
    <TestWrapper schemaTypes={schemaTypes}>
      <div style={{padding: 100}}>
        <FormFieldValidationStatus validation={VALIDATION} />
        <button data-testid="outside" style={{marginTop: 200}} type="button">
          Outside
        </button>
      </div>
    </TestWrapper>
  )
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function openTooltip() {
  return [...document.querySelectorAll<HTMLElement>('[role="tooltip"]')].find(
    (element) => element.textContent?.includes(MESSAGE) && element.checkVisibility(),
  )
}

const isOpen = () => Boolean(openTooltip())

async function hoverTrigger() {
  await expect.element(page.getByTestId('validation-status')).toBeVisible()
  await userEvent.hover(page.getByTestId('validation-status'))
  await expect.poll(isOpen, {timeout: 2000}).toBe(true)
}

/** Walks the pointer from the trigger towards the tooltip one pixel at a time, as a mouse does. */
async function walkPointerOntoTooltip() {
  const trigger = page.getByTestId('validation-status')
  const triggerRect = trigger.element().getBoundingClientRect()
  const tooltipRect = openTooltip()!.getBoundingClientRect()
  const x = triggerRect.width / 2
  const distance = Math.ceil(tooltipRect.top - triggerRect.top) + 4

  for (let y = triggerRect.height / 2; y <= distance; y++) {
    await userEvent.hover(trigger, {force: true, position: {x, y}})
  }
}

describe('FormFieldValidationStatus', () => {
  it('keeps the message open while the pointer crosses onto it, so it can be selected and copied', async () => {
    void render(<Harness />)
    await hoverTrigger()
    await walkPointerOntoTooltip()
    await wait(400)
    expect(isOpen()).toBe(true)

    await userEvent.tripleClick(openTooltip()!)
    expect(window.getSelection()?.toString()).toContain(MESSAGE)

    // Leaving with text selected keeps it open for copying, until a click elsewhere
    await userEvent.hover(page.getByTestId('outside'))
    await wait(400)
    expect(isOpen()).toBe(true)

    await userEvent.click(page.getByTestId('outside'))
    await expect.poll(isOpen).toBe(false)
  })

  it('closes when the pointer leaves the message without selecting anything', async () => {
    void render(<Harness />)
    await hoverTrigger()
    await walkPointerOntoTooltip()
    await userEvent.hover(page.getByTestId('outside'))
    await expect.poll(isOpen).toBe(false)
  })

  it('opens on keyboard focus and closes on Escape', async () => {
    void render(<Harness />)
    await expect.element(page.getByTestId('validation-status')).toBeVisible()
    await userEvent.tab()
    await expect.element(page.getByTestId('validation-status')).toHaveFocus()
    await expect.poll(isOpen).toBe(true)
    await expect
      .element(page.getByTestId('validation-status'))
      .toHaveAttribute('aria-describedby', openTooltip()!.id)

    await userEvent.keyboard('{Escape}')
    await expect.poll(isOpen).toBe(false)
  })
})
