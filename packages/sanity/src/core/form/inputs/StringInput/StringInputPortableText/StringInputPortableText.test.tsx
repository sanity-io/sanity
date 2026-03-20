import {screen, waitFor} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {renderStringInput} from '../../../../../../test/form/renderStringInput'
import {StringInputPortableText} from './StringInputPortableText'

// This is only partially tested at the moment, because jsdom does not support contenteditable. This
// is a good candidate to adopt Vitest Browser Mode, which would allow the test suite to reach
// parity with `StringInputBasic.test.tsx`.
describe('StringInputPortableText', () => {
  it('renders input value', async () => {
    await renderStringInput({
      render: (inputProps) => <StringInputPortableText {...inputProps} value="test" />,
      fieldDefinition: {
        type: 'string',
        name: 'string',
        title: 'String',
      },
    })

    const input = screen.getByTestId('string-input-portable-text')

    await waitFor(() => {
      expect(input).toHaveTextContent('test')
    })
  })
})
