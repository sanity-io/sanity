import PropTypes from 'prop-types'
import React from 'react'
import {PatchEvent, set, setIfMissing, unset} from 'part:@sanity/form-builder/patch-event'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import TextInput from 'part:@sanity/components/textinputs/default'

const durationToSeconds = duration => {
  const [hh = 0, mm = 0, ss = 0] = duration.split(':').map(Number)
  return hh * 60 * 60 + mm * 60 + ss
}

export default class DurationWithSecondsInput extends React.PureComponent {
  static propTypes = {
    type: PropTypes.shape({
      title: PropTypes.string,
      name: PropTypes.string,
      fields: PropTypes.array
    }).isRequired,
    level: PropTypes.number,
    value: PropTypes.shape({
      _type: PropTypes.string,
      duration: PropTypes.string,
      asSeconds: PropTypes.number
    }),
    onFocus: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    onBlur: PropTypes.func.isRequired
  }

  durationInput = React.createRef()

  handleDurationInputChange = event => {
    const {onChange, type} = this.props
    const durationInputValue = event.currentTarget.value.trim()
    if (!durationInputValue) {
      onChange(PatchEvent.from(unset()))
      return
    }

    onChange(
      PatchEvent.from([
        setIfMissing({_type: type.name}),
        set(durationInputValue, ['duration']),
        set(durationToSeconds(durationInputValue), ['asSeconds'])
      ])
    )
  }

  focus() {
    this.durationInput.current.focus()
  }

  render() {
    const {type, value, level, onFocus, onBlur} = this.props
    const durationField = type.fields.find(field => field.name === 'duration')
    const asSecondsField = type.fields.find(field => field.name === 'asSeconds')
    return (
      <Fieldset level={level} legend={type.title} description={type.description}>
        <label>
          {/* you may want to display additional fields here as well, e.g. description  */}
          {durationField.type.title}
          <TextInput
            type="text"
            ref={this.durationInput}
            value={value && value.duration}
            onChange={this.handleDurationInputChange}
            placeholder={durationField.type.placeholder}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </label>
        {value && (
          <div>
            {asSecondsField.type.title}: {value.asSeconds}
          </div>
        )}
      </Fieldset>
    )
  }
}
