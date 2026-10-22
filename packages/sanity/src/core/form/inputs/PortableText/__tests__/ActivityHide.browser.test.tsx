import {defineArrayMember, defineField, defineType} from '@sanity/types'
import {Activity} from 'react'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

const schemaTypes = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'body',
        of: [defineArrayMember({type: 'block'})],
      }),
    ],
  }),
]

function Harness({mode}: {mode: 'visible' | 'hidden'}) {
  return (
    <TestWrapper schemaTypes={schemaTypes}>
      <Activity mode={mode}>
        <TestForm />
      </Activity>
    </TestWrapper>
  )
}

describe('Portable Text Input inside an Activity boundary', () => {
  it('keeps the editor mounted in its field while hidden', async () => {
    const {getFocusedPortableTextEditor, insertPortableText, settleChromaticEndState} =
      testHelpers()
    const screen = await render(<Harness mode="visible" />)
    const $pte = await getFocusedPortableTextEditor('field-body')
    await insertPortableText('Hello there', $pte)
    const editable = $pte.element()
    const wrapper = editable.closest('[data-wrapper]')
    expect(wrapper).not.toBeNull()

    // Hiding detaches refs: the field's portal target lives in state fed by a callback ref, so
    // it must survive the detach or the editor is remounted into the default portal element,
    // and remounted again into the field on reveal.
    await screen.rerender(<Harness mode="hidden" />)
    await expect.element(page.getByTestId('field-body')).not.toBeVisible()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(editable.isConnected).toBe(true)
    expect(editable.closest('[data-wrapper]')).toBe(wrapper)

    await screen.rerender(<Harness mode="visible" />)
    const $revealed = page.getByTestId('field-body').getByRole('textbox')
    await expect.element($revealed).toBeVisible()
    expect($revealed.element()).toBe(editable)
    await expect.element($revealed).toMatchTextContent('Hello there')
    await settleChromaticEndState()
  })
})
