// @flow
import moment from 'moment'
import type Moment from 'moment'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker-cssmodules.css' // eslint-disable-line import/no-unassigned-import
import {uniqueId} from 'lodash'
import React from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import styles from './styles/DateTimeInput.css'
import PatchEvent, {set, unset} from '../../PatchEvent'

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
  type: {
    name: string,
    title: string,
    description: string,
    options?: SchemaOptions,
  },
  onChange: PatchEvent => void,
  level: number
}


function parseOptions(options: SchemaOptions = {}): ParsedOptions {
  return {
    dateFormat: options.dateFormat || DEFAULT_DATE_FORMAT,
    timeFormat: options.timeFormat || DEFAULT_TIME_FORMAT,
    timeStep: (('timeStep' in options) && Number(options.timeStep)) || 15,
    calendarTodayLabel: options.calendarTodayLabel || 'Today'
  }
}

const getFormat = (options: ParsedOptions) => `${options.dateFormat} ${options.timeFormat}`

type State = {
  inputValue: ?string
}

export default class DateInput extends React.Component<Props, State> {
  inputId: string = uniqueId('date-input')

  state = {
    inputValue: null
  }

  handleInputChange = (event: SyntheticEvent<HTMLInputElement>) => {
    const inputValue = event.currentTarget.value
    const parsed = moment(inputValue, getFormat(parseOptions(this.props.type.options)), true)
    if (parsed.isValid()) {
      this.setMoment(parsed)
    } else {
      this.setState({inputValue: inputValue})
    }
  }

  handleChange = (nextMoment?: Moment) => {
    this.setState({inputValue: null})
    if (nextMoment) {
      this.setMoment(nextMoment)
    } else {
      this.unset()
    }
  }
  handleBlur = () => {
    this.setState({inputValue: null})
  }

  setMoment(nextMoment: Moment) {
    this.set(nextMoment.toDate().toJSON())
    this.setState({inputValue: null})
  }

  set(value: string) {
    this.props.onChange(PatchEvent.from([set(value)]))
  }

  unset() {
    this.props.onChange(PatchEvent.from([unset()]))
  }

  render() {
    const {value, type, level} = this.props
    const {inputValue} = this.state
    const {title, description} = type

    const momentValue: ?Moment = value ? moment(value) : null

    const options = parseOptions(type.options)

    const placeholder = type.placeholder || `e.g. ${moment().format(getFormat(options))}`

    return (
      <FormField labelFor={this.inputId} label={title} level={level} description={description}>
        <div className={styles.root}>
          <DatePicker
            {...options}
            showMonthDropdown
            showYearDropdown
            todayButton={options.calendarTodayLabel}
            selected={momentValue || undefined}
            placeholderText={placeholder}
            calendarClassName={styles.datepicker}
            className={styles.input}
            onChange={this.handleChange}
            onChangeRaw={this.handleInputChange}
            value={inputValue ? inputValue : (momentValue && momentValue.format(getFormat(options)))}
            showTimeSelect
            disabledKeyboardNavigation
            dateFormat={options.dateFormat}
            timeFormat={options.timeFormat}
            timeIntervals={options.timeStep}
            onBlur={this.handleBlur}
          />
        </div>
      </FormField>
    )
  }
}
