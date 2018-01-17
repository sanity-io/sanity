// @flow
import moment from 'moment'
import type Moment from 'moment'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker-cssmodules.css' // eslint-disable-line import/no-unassigned-import
import {uniqueId} from 'lodash'
import React from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import TextInput from 'part:@sanity/components/textinputs/default'
import styles from './styles/DateTimeInput.css'
import PatchEvent, {set, unset} from '../../PatchEvent'
import Dialog from 'part:@sanity/components/dialogs/default'
import Button from 'part:@sanity/components/buttons/default'
import CalendarIcon from 'part:@sanity/base/calendar-icon'

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
    readOnly?: boolean,
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
  _datepicker: ?DatePicker
  inputId: string = uniqueId('date-input')

  state = {
    inputValue: null,
    isActive: false
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
  focus() {
    if (this._datepicker) {
      this._datepicker.input.focus()
    }
  }

  setDatePicker = (datePicker: ?DatePicker) => {
    this._datepicker = datePicker
  }

  setDialogDatePicker = (datePicker: ?DatePicker) => {
    this._dialogdatepicker = datePicker
    console.log(datepicker, datepicker.input)
  }

  handleKeyDown = event => {
    if (event.key === 'Enter') {
      this.handleOpen()
    }
  }

  handleClose = event => {
    this.setState({
      isActive: false
    })
  }

  handleOpen = () => {
    this.setState({
      isActive: true
    })
  }

  handleDialogAction = action => {
    if (action.name === 'close') {
      this.handleClose()
    }

    if (action.name === 'today') {
      this.setMoment(moment())
    }
  }

  render() {
    const {value, type, level, ...rest} = this.props
    const {inputValue, isActive} = this.state
    const {title, description, readOnly} = type
    const momentValue: ?Moment = value ? moment(value) : null

    const options = parseOptions(type.options)

    const placeholder = type.placeholder || `e.g. ${moment().format(getFormat(options))}`

    const DIALOG_ACTIONS = [
      {
        index: 1,
        name: 'close',
        title: 'Close'
      },
      {
        index: 2,
        name: 'today',
        kind: 'simple',
        color: 'primary',
        title: options.calendarTodayLabel,
        secondary: true
      }
    ]

    return (
      <FormField labelFor={this.inputId} label={title} level={level} description={description}>
        {
          readOnly && (
            <TextInput
              readOnly
              value={(momentValue ? momentValue.format(getFormat(options)) : '')}
            />
          )
        }
        {
          !readOnly && (
            <div className={styles.inputWrapper}>
              <DatePicker
                {...options}
                {...rest}
                onKeyDown={this.handleKeyDown}
                disabledKeyboardNavigation
                selected={momentValue || undefined}
                placeholderText={placeholder}
                calendarClassName={styles.datepicker}
                popperClassName={styles.hiddenPopper}
                className={styles.input}
                onChange={this.handleChange}
                onChangeRaw={this.handleInputChange}
                value={inputValue ? inputValue : (momentValue && momentValue.format(getFormat(options)))}
                dateFormat={options.dateFormat}
                timeFormat={options.timeFormat}
                timeIntervals={options.timeStep}
                ref={this.setDatePicker}
              />
              <Button color="primary" className={styles.selectButton} onClick={this.handleOpen} icon={CalendarIcon} kind="simple">Select</Button>
            </div>
          )
        }
        {
          isActive && (
            <Dialog
              isOpen={isActive}
              onClose={this.handleClose}
              onAction={this.handleDialogAction}
              actions={DIALOG_ACTIONS}
              showCloseButton={false}
            >
              <div className={styles.rootWithTime}>
                <DatePicker
                  {...options}
                  {...rest}
                  inline
                  showMonthDropdown
                  showYearDropdown
                  selected={momentValue || undefined}
                  calendarClassName={styles.datepicker}
                  popperClassName={styles.popper}
                  className={styles.input}
                  onChange={this.handleChange}
                  onChangeRaw={this.handleInputChange}
                  value={inputValue ? inputValue : (momentValue && momentValue.format(getFormat(options)))}
                  showTimeSelect
                  dateFormat={options.dateFormat}
                  timeFormat={options.timeFormat}
                  timeIntervals={options.timeStep}
                  ref={this.setDialogDatePicker}
                  dropdownMode="select"
                />
              </div>
            </Dialog>
          )
        }
      </FormField>
    )
  }
}
