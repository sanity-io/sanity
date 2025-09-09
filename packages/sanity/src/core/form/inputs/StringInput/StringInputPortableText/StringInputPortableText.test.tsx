import {waitFor} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {renderStringInput} from '../../../../../../test/form/renderStringInput'
import {StringInputPortableText} from './StringInputPortableText'

const INPUT_SELECTOR = '[data-testid="string-input-portable-text"]'

// This is only partially tested at the moment, because jsdom does not support contenteditable. This
// is a good candidate to adopt Vitest Browser Mode, which would allow the test suite to reach
// parity with `StringInputBasic.test.tsx`.
describe('StringInputPortableText', () => {
  it('renders input value', async () => {
    const {result} = await renderStringInput({
      render: (inputProps) => <StringInputPortableText {...inputProps} value="test" />,
      fieldDefinition: {
        type: 'string',
        name: 'string',
        title: 'String',
      },
    })

    const input = result.container.querySelector(INPUT_SELECTOR)

    await waitFor(() => {
      expect(input).toHaveTextContent('test')
    })
  })
})
