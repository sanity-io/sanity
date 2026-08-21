import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {useState} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {Search} from './Search'

interface LaggingSearchHostProps {
  onChange: (query: string) => void
}

function LaggingSearchHost(props: LaggingSearchHostProps) {
  const {onChange} = props
  const [query, setQuery] = useState('')

  return (
    <Search
      query={query}
      onChange={(nextQuery) => {
        onChange(nextQuery)
        setQuery(nextQuery.slice(-1))
      }}
    />
  )
}

describe('Search', () => {
  it('keeps the typed value when the parent query prop lags', async () => {
    const onChange = vi.fn()
    const wrapper = await createTestProvider({
      resources: [structureUsEnglishLocaleBundle],
    })

    render(<LaggingSearchHost onChange={onChange} />, {wrapper})

    const input = await screen.findByPlaceholderText('Search')
    await userEvent.type(input, 'hello')

    expect(input).toHaveValue('hello')
    expect(onChange).toHaveBeenCalledWith('hello')
  })
})
