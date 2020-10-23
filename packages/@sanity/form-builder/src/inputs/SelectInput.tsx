import React from 'react'
import {uniqueId, capitalize} from 'lodash'
import {isTitledListValue, TitledListValue} from '@sanity/types'
import FormField from 'part:@sanity/components/formfields/default'
import Select from 'part:@sanity/components/selects/default'
import RadioSelect from 'part:@sanity/components/selects/radio'
import PatchEvent, {set, unset} from '../PatchEvent'
import {Props} from './types'

const EMPTY_ITEM = {title: '', value: undefined}

function toSelectItem(
  option: TitledListValue<string | number> | string | number
): TitledListValue<string | number> {
  return isTitledListValue(option) ? option : {title: capitalize(`${option}`), value: option}
}

export default class SelectInput extends React.Component<Props<string | number>> {
  _input: (RadioSelect | Select) | null
  name = uniqueId('RadioName')
  static defaultProps = {
    value: '',
  }

  handleChange = (item: string | number | TitledListValue<string | number>) => {
    const {onChange} = this.props
    const newValue = typeof item === 'string' || typeof item === 'number' ? item : item.value
    onChange(PatchEvent.from(typeof newValue === 'undefined' ? unset() : set(newValue)))
  }

  focus() {
    if (this._input) {
      this._input.focus()
    }
  }

  setInput = (input: (RadioSelect | Select) | null) => {
    this._input = input
  }

  render() {
    const {value, readOnly, markers, type, level, onFocus, presence} = this.props
    const items = ((type.options?.list || []) as unknown[]).map(toSelectItem)
    const currentItem = items.find((item) => item.value === value)
    const isRadio = type.options && type.options.layout === 'radio'
    const validation = markers.filter((marker) => marker.type === 'validation')
    return (
      <FormField
        labelFor={this.name}
        markers={markers}
        level={level}
        label={type.title}
        description={type.description}
        presence={presence}
        onFocus={onFocus}
      >
        {isRadio ? (
          <RadioSelect
            name={this.name}
            legend={type.title}
            items={items}
            onChange={this.handleChange}
            onFocus={onFocus}
            value={currentItem}
            direction={type.options.direction || 'vertical'}
            ref={this.setInput}
            readOnly={readOnly}
          />
        ) : (
          <Select
            id={this.name}
            label={type.title}
            value={currentItem}
            placeholder={type.placeholder}
            onChange={this.handleChange}
            onFocus={onFocus}
            items={[EMPTY_ITEM].concat(items)}
            ref={this.setInput}
            readOnly={readOnly}
            hasError={validation.length >= 1}
          />
        )}
      </FormField>
    )
  }
}
