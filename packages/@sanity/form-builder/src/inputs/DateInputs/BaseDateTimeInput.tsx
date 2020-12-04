// eslint-disable-next-line import/no-unassigned-import
import 'react-datepicker/dist/react-datepicker-cssmodules.css'

import React from 'react'
import ReactDOM from 'react-dom'
import moment, {Moment} from 'moment'
import DatePicker from 'react-datepicker'
import {isValidationErrorMarker, Marker} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import Button from 'part:@sanity/components/buttons/default'
import CalendarIcon from 'part:@sanity/base/calendar-icon'
import {uniqueId} from 'lodash'
import {FormField} from '../../components/FormField'
import styles from './styles/BaseDateTimeInput.css'

type Props = {
  value: Moment | null
  markers: Array<Marker>
  dateOnly?: boolean
  dateFormat: string
  timeFormat?: string
  timeStep?: number
  todayLabel: string
  title: string | null
  description: string | null
  placeholder: string | null
  readOnly: boolean | null
  onChange: (event: Moment) => void
  onFocus?: (event: any) => void
  onBlur?: (event: any) => void
  level: number
  presence: any
}

const getFormat = (dateFormat, timeFormat) => dateFormat + (timeFormat ? ` ${timeFormat}` : '')
type State = {
  inputValue: string | null
  isDialogOpen: boolean
}

export default class BaseDateTimeInput extends React.Component<Props, State> {
  _datepicker: DatePicker | null
  _inputId = uniqueId('BaseDateTimeInput')
  state = {
    inputValue: null,
    isDialogOpen: false,
  }
  handleInputChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
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
    this.setState({inputValue: null})
  }
  handleSetNow = (event) => {
    this.handleDialogChange(moment())
  }
  focus() {
    if (this._datepicker) {
      this._datepicker.input.focus()
    }
  }
  setDatePicker = (datePicker: DatePicker | null) => {
    this._datepicker = datePicker
  }
  handleInputKeyDown = (event) => {
    if (event && event.key === 'Enter') {
      this.handleOpen()
    }
    return event
  }
  handleButtonClick = (event) => {
    this.focus()
    this.handleOpen()
  }
  handleOpen = () => {
    this.setState({
      isDialogOpen: true,
    })
  }
  handleClose = () => {
    this.setState({
      isDialogOpen: false,
    })
  }
  handleBlur = (event) => {
    this.handleClose()
    this.setState({inputValue: null})
    if (this.props.onBlur) {
      this.props.onBlur(event)
    }
  }
  handleFocus = (event) => {
    if (this.props.onFocus) {
      this.props.onFocus(event)
    }
  }
  renderPopperContainer = ({children}) => {
    const {isDialogOpen} = this.state
    return ReactDOM.createPortal(
      <div className={isDialogOpen ? styles.portal : styles.portalClosed}>{children}</div>,
      document.body
    )
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
      level,
      presence,
    } = this.props
    const {inputValue, isDialogOpen} = this.state
    const format = getFormat(dateFormat, timeFormat)
    const placeholder = this.props.placeholder || `e.g. ${moment().format(format)}`
    const errors = markers.filter(isValidationErrorMarker)
    return (
      <FormField
        markers={markers}
        label={title}
        level={level}
        description={description}
        presence={presence}
        labelFor={this._inputId}
      >
        {readOnly && (
          <TextInput
            id={this._inputId}
            customValidity={errors.length > 0 ? errors[0].item.message : ''}
            readOnly
            value={value ? value.format(format) : ''}
          />
        )}
        {!readOnly && (
          <div className={styles.root}>
            <div className={styles.inputWrapper} id={this._inputId}>
              <DatePicker
                onKeyDown={isDialogOpen ? undefined : this.handleInputKeyDown}
                autoFocus={false}
                onFocus={this.handleFocus}
                onBlur={this.handleBlur}
                showMonthDropdown
                showYearDropdown
                disabledKeyboardNavigation={!isDialogOpen}
                selected={value || undefined}
                placeholderText={placeholder}
                calendarClassName={styles.datepicker}
                popperClassName={styles.popper}
                popperContainer={this.renderPopperContainer}
                popperProps={{positionFixed: true}}
                className={styles.input}
                onClickOutside={this.handleClose}
                onChange={this.handleDialogChange}
                onChangeRaw={this.handleInputChange}
                value={inputValue ? inputValue : value && value.format(format)}
                showTimeSelect={!dateOnly}
                dateFormat={dateFormat}
                timeFormat={timeFormat}
                timeIntervals={timeStep}
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
                bleed
                onClick={this.handleButtonClick}
                icon={CalendarIcon}
                kind="simple"
                title="Select date"
              />
            </div>
          </div>
        )}
      </FormField>
    )
  }
}
