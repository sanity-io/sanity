import type Moment from 'moment'
// @flow
import moment from 'moment'
import 'react-datepicker/dist/react-datepicker-cssmodules.css' // eslint-disable-line import/no-unassigned-import
import {uniqueId} from 'lodash'
import React from 'react'
import PatchEvent, {set, unset} from '../../PatchEvent'
import type {Marker} from '../../typedefs'
import BaseDateTimeInput from './BaseDateTimeInput'

type ParsedOptions = {
  dateFormat: string,
  timeFormat: string,
  timeStep: number,
  calendarTodayLabel: string
}

type SchemaOptions = {
  dateFormat?: string,
  timeFormat?: string,
  timeStep?: number,
  calendarTodayLabel?: string
}

const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD'
const DEFAULT_TIME_FORMAT = 'HH:mm'

type Props = {
  value: string,
  markers: Array<Marker>,
  type: {
    name: string,
    title: string,
    description: string,
    options?: SchemaOptions,
    placeholder?: string
  },
  readOnly: ?boolean,
  onChange: PatchEvent => void,
  level: number
}

function parseOptions(options: SchemaOptions = {}): ParsedOptions {
  return {
    dateFormat: options.dateFormat || DEFAULT_DATE_FORMAT,
    timeFormat: options.timeFormat || DEFAULT_TIME_FORMAT,
    timeStep: ('timeStep' in options && Number(options.timeStep)) || 15,
    calendarTodayLabel: options.calendarTodayLabel || 'Now'
  }
}

export default class DateInput extends React.Component<Props> {
  baseDateTimeInputRef: ?BaseDateTimeInput = null

  handleChange = (nextMoment?: Moment) => {
    const patch = nextMoment ? set(nextMoment.toDate().toJSON()) : unset()
    this.props.onChange(PatchEvent.from([patch]))
  }

  focus() {
    if (this.baseDateTimeInputRef) {
      this.baseDateTimeInputRef.focus()
    }
  }

  setBaseInput = (baseInput: ?BaseDateTimeInput) => {
    this.baseDateTimeInputRef = baseInput
  }

  render() {
    const {value, markers, type, readOnly, level} = this.props
    const {title, description} = type
    const momentValue: ?Moment = value ? moment(value) : null

    const options = parseOptions(type.options)

    return (
      <BaseDateTimeInput
        ref={this.setBaseInput}
        value={momentValue}
        readOnly={readOnly}
        level={level}
        title={title}
        description={description}
        placeholder={type.placeholder}
        markers={markers}
        dateFormat={options.dateFormat}
        timeFormat={options.timeFormat}
        timeStep={options.timeStep}
        todayLabel={options.calendarTodayLabel}
        onChange={this.handleChange}
      />
    )
  }
}
