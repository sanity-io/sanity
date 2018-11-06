/* eslint-disable complexity */
// @flow
import React from 'react'
import ReactDOM from 'react-dom'
import moment from 'moment'
import type Moment from 'moment'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker-cssmodules.css' // eslint-disable-line import/no-unassigned-import
import FormField from 'part:@sanity/components/formfields/default'
import TextInput from 'part:@sanity/components/textinputs/default'
import Button from 'part:@sanity/components/buttons/default'
import CalendarIcon from 'part:@sanity/base/calendar-icon'
import type {Marker} from '../../typedefs'
import styles from './styles/BaseDateTimeInput.css'

type Props = {
  value: ?Moment,
  markers: Array<Marker>,
  dateOnly?: boolean,
  dateFormat: string,
  timeFormat?: string,
  timeStep?: number,
  todayLabel: string,
  title: ?string,
  description: ?string,
  placeholder: ?string,
  readOnly: ?boolean,
  onChange: (?Moment) => void,
  level: number
}

const getFormat = (dateFormat, timeFormat) => dateFormat + (timeFormat ? ` ${timeFormat}` : '')

type State = {
  inputValue: ?string,
  isDialogOpen: boolean
}

export default class BaseDateTimeInput extends React.Component<Props, State> {
  _datepicker: ?DatePicker

  state = {
    inputValue: null,
    isDialogOpen: false
  }

  handleInputChange = (event: SyntheticEvent<HTMLInputElement>) => {
    const inputValue = event.currentTarget.value
    const {onChange, dateFormat, timeFormat} = this.props
    const parsed = moment(inputValue, getFormat(dateFormat, timeFormat), true)
    if (parsed.isValid()) {
      this.setState({inputValue: null})
      onChange(parsed)
    } else {
      this.setState({inputValue: inputValue})
    }
  }

  handleDialogChange = (nextMoment?: Moment) => {
    const {onChange} = this.props
    onChange(nextMoment)
    this.setState({inputValue: null, isDialogOpen: false})
  }

  handleSetNow = event => {
    this.handleDialogChange(moment())
  }

  focus() {
    if (this._datepicker) {
      this._datepicker.input.focus()
    }
  }
  setDatePicker = (datePicker: ?DatePicker) => {
    this._datepicker = datePicker
  }

  handleKeyDown = (event: SyntheticKeyboardEvent<*>) => {
    if (event.key === 'Enter') {
      this.handleOpen()
    }
    if (event.key === 'Escape') {
      this.handleClose()
    }
  }
  handleOpen = event => {
    this.setState({
      isDialogOpen: true
    })
    // Prevent focus the input to avoid software keybaord on mobile devices
    event.preventDefault()
  }

  handleClose = () => {
    this.setState({
      isDialogOpen: false
    })
  }

  handleBlur = event => {
    this.handleClose()
    this.setState({inputValue: null})
    if (this.props.onBlur) {
      this.props.onBlur(event)
    }
  }

  handleFocus = event => {
    if (this.props.onFocus) {
      this.props.onFocus(event)
    }
  }

  renderPopperContainer = ({children}) => {
    return ReactDOM.createPortal(<div className={styles.portal}>{children}</div>, document.body)
  }

  render() {
    const {
      value,
      markers,
      dateOnly,
      dateFormat,
      timeFormat,
      title,
      description,
      todayLabel,
      readOnly,
      timeStep,
      level
    } = this.props

    const {inputValue, isDialogOpen} = this.state

    const format = getFormat(dateFormat, timeFormat)
    const placeholder = this.props.placeholder || `e.g. ${moment().format(format)}`

    const validation = markers.filter(marker => marker.type === 'validation')
    const errors = validation.filter(marker => marker.level === 'error')

    return (
      <FormField markers={markers} label={title} level={level} description={description}>
        {readOnly && (
          <TextInput
            customValidity={errors.length > 0 ? errors[0].item.message : ''}
            readOnly
            value={value ? value.format(format) : ''}
          />
        )}
        {!readOnly && (
          <div className={errors.length > 0 ? styles.rootError : styles.root}>
            <div className={styles.inputWrapper}>
              <DatePicker
                onKeyDown={this.handleKeyDown}
                autoFocus={false}
                // onFocus={this.handleFocus}
                // onBlur={this.handleBlur}
                onFocus={() => {}}
                showMonthDropdown
                showYearDropdown
                disabledKeyboardNavigation
                selected={value || undefined}
                placeholderText={placeholder}
                calendarClassName={styles.datepicker}
                popperClassName={styles.popper}
                popperContainer={isDialogOpen && this.renderPopperContainer}
                popperProps={{positionFixed: true}}
                className={styles.input}
                onClickOutside={this.handleClose}
                onInputClick={this.handleOpen}
                onChange={this.handleDialogChange}
                onChangeRaw={this.handleInputChange}
                value={inputValue ? inputValue : value && value.format(format)}
                showTimeSelect={!dateOnly}
                dateFormat={dateFormat}
                timeFormat={timeFormat}
                timeIntervals={timeStep}
                open={isDialogOpen}
                ref={this.setDatePicker}
                dropdownMode="select"
                todayButton={
                  <Button color="primary" onClick={this.handleSetNow}>
                    {todayLabel}
                  </Button>
                }
              />
            </div>
            <div className={styles.buttonWrapper}>
              <Button
                color="primary"
                bleed
                onClick={this.handleOpen}
                icon={CalendarIcon}
                kind="simple"
              >
                Select
              </Button>
            </div>
          </div>
        )}
      </FormField>
    )
  }
}
