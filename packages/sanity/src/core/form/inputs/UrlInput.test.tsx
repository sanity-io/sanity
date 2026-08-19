import {describe, expect, it} from 'vitest'

import {renderStringInput} from '../../../../test/form/renderStringInput'
import {UrlInput} from './UrlInput'

describe('url-input', () => {
  it('renders type equals "url" by default', async () => {
    const {result} = await renderStringInput({
      fieldDefinition: {
        name: 'defaultUrl',
        title: 'Url',
        type: 'url',
      },
      render: (inputProps) => <UrlInput {...inputProps} />,
    })

    expect(result.container.querySelector('input')).toHaveAttribute('type', 'url')
  })

  it('renders type equals "text" when relative urls are allowed', async () => {
    const {result} = await renderStringInput({
      fieldDefinition: {
        name: 'relativeUrl',
        title: 'Url',
        type: 'url',
        validation: (rule) => rule.uri({allowRelative: true}),
      },
      render: (inputProps) => <UrlInput {...inputProps} />,
    })

    expect(result.container.querySelector('input')).toHaveAttribute('type', 'text')
  })

  it('renders rules declared by context-aware validation', async () => {
    const {result} = await renderStringInput({
      fieldDefinition: {
        name: 'contextAwareRelativeUrl',
        title: 'Url',
        type: 'url',
        validation: (rule, context) =>
          context?.hidden ? rule.skip() : rule.uri({allowRelative: true}),
      },
      render: (inputProps) => <UrlInput {...inputProps} />,
    })

    expect(result.container.querySelector('input')).toHaveAttribute('type', 'text')
  })
})
