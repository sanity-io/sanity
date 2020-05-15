import moment, {Moment} from 'moment'
import React from 'react'
import PatchEvent, {set, unset} from '../../PatchEvent'
import {Marker} from '../../typedefs'
import BaseDateTimeInput from './BaseDateTimeInput'
type ParsedOptions = {
  dateFormat: string
  calendarTodayLabel: string
}
type SchemaOptions = {
  dateFormat?: string
  calendarTodayLabel?: string
}
// This is the format dates are stored on
const VALUE_FORMAT = 'YYYY-MM-DD'
// default to how they are stored
const DEFAULT_DATE_FORMAT = VALUE_FORMAT
type Props = {
  value: string
  markers: Array<Marker>
  type: {
    name: string
    title: string
    description: string
    options?: SchemaOptions
    placeholder?: string
  }
  readOnly: boolean | null
  onChange: (arg0: PatchEvent) => void
  level: number
  onFocus: () => void
  presence: any
}
function parseOptions(options: SchemaOptions = {}): ParsedOptions {
  return {
    dateFormat: options.dateFormat || DEFAULT_DATE_FORMAT,
    calendarTodayLabel: options.calendarTodayLabel || 'Today'
  }
}
export default class DateInput extends React.Component<Props> {
  baseDateTimeInputRef: BaseDateTimeInput | null = null
  handleChange = (nextMoment?: Moment) => {
    const patch = nextMoment ? set(nextMoment.format(VALUE_FORMAT)) : unset()
    this.props.onChange(PatchEvent.from([patch]))
  }
  focus() {
    if (this.baseDateTimeInputRef) {
      this.baseDateTimeInputRef.focus()
    }
  }
  setBaseInput = (baseInput: BaseDateTimeInput | null) => {
    this.baseDateTimeInputRef = baseInput
  }
  render() {
    const {value, markers, type, readOnly, level, onFocus, presence} = this.props
    const {title, description} = type
    const momentValue: Moment | null = value ? moment(value) : null
    const options = parseOptions(type.options)
    return (
      <BaseDateTimeInput
        dateOnly
        ref={this.setBaseInput}
        value={momentValue}
        readOnly={readOnly}
        level={level}
        title={title}
        description={description}
        placeholder={type.placeholder}
        markers={markers}
        dateFormat={options.dateFormat}
        todayLabel={options.calendarTodayLabel}
        onChange={this.handleChange}
        onFocus={onFocus}
        presence={presence}
      />
    )
  }
}
