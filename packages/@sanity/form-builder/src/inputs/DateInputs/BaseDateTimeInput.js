// @flow
import moment from 'moment'
import type Moment from 'moment'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker-cssmodules.css' // eslint-disable-line import/no-unassigned-import
import React from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import TextInput from 'part:@sanity/components/textinputs/default'
import styles from './styles/BaseDateTimeInput.css'
import type {Marker} from '../../typedefs'
import Dialog from 'part:@sanity/components/dialogs/default'
import Button from 'part:@sanity/components/buttons/default'
import CalendarIcon from 'part:@sanity/base/calendar-icon'

type Action = {
  name: string
}

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
    this.setState({inputValue: null})
  }

  handleBlur = () => {
    this.setState({inputValue: null})
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
      this.open()
    }
  }
  open = () => {
    this.setState({
      isDialogOpen: true
    })
  }

  close = () => {
    this.setState({
      isDialogOpen: false
    })
  }

  handleDialogOpen = this.open
  handleDialogClose = this.close

  handleDialogAction = (action: Action) => {
    if (action.name === 'close') {
      this.close()
    }

    if (action.name === 'now') {
      this.handleDialogChange(moment())
    }
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
          <div className={errors.length > 0 ? styles.inputWrapperWithError : styles.inputWrapper}>
            <DatePicker
              onKeyDown={this.handleKeyDown}
              disabledKeyboardNavigation
              selected={value || undefined}
              placeholderText={placeholder}
              calendarClassName={styles.datePicker}
              popperClassName={styles.hiddenPopper}
              className={styles.input}
              onChange={this.handleDialogChange}
              onChangeRaw={this.handleInputChange}
              value={inputValue ? inputValue : value && value.format(format)}
              dateFormat={dateFormat}
              timeFormat={timeFormat}
              timeIntervals={timeStep}
              ref={this.setDatePicker}
            />
            <Button
              color="primary"
              className={styles.selectButton}
              onClick={this.handleDialogOpen}
              icon={CalendarIcon}
              kind="simple"
            >
              Select
            </Button>
          </div>
        )}
        {isDialogOpen && (
          <Dialog
            isOpen={isDialogOpen}
            onClose={this.handleDialogClose}
            onAction={this.handleDialogAction}
            actions={[
              {name: 'close', title: 'Close'},
              {name: 'now', kind: 'simple', color: 'primary', title: todayLabel, secondary: true}
            ]}
            showCloseButton={false}
          >
            <div className={dateOnly ? styles.dialogDatePicker : styles.dialogDatePickerWithTime}>
              <DatePicker
                inline
                showMonthDropdown
                showYearDropdown
                selected={value || undefined}
                calendarClassName={styles.datePicker}
                popperClassName={styles.popper}
                className={styles.input}
                onChange={this.handleDialogChange}
                value={inputValue ? inputValue : value && value.format(format)}
                showTimeSelect={!dateOnly}
                dateFormat={dateFormat}
                timeFormat={timeFormat}
                timeIntervals={timeStep}
                dropdownMode="select"
              />
            </div>
          </Dialog>
        )}
      </FormField>
    )
  }
}
