import type React from 'react'
import {AutocompleteSuggestionItem} from './types'
interface DefaultAutocompleteProps {
  id?: string
  label: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onSelect?: (item: AutocompleteSuggestionItem) => void
  placeholder?: string
  suggestions?: AutocompleteSuggestionItem[]
  value?: string
}
export default class DefaultAutocomplete extends React.PureComponent<DefaultAutocompleteProps> {
  _inputId?: string
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  UNSAFE_componentWillMount(): void
  render(): JSX.Element
}
export {}
