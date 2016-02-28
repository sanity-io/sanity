import React from 'react'
import ControlledValue from '../mixins/ControlledValue'
import DateTimePicker from './DateTimePicker'

const EventTime = React.createClass({
  displayName: 'DateIntervalPicker',
  mixins: [ControlledValue],
  getInitialState() {
    return {showEndTime: false}
  },
  componentDidMount() {
    this.updateEndTimeVisibility(this.props.value)
  },
  componentWillReceiveProps(nextProps) {
    this.updateEndTimeVisibility(nextProps.value)
  },
  updateEndTimeVisibility(value) {
    this.setState({showEndTime: value && value.end})
  },
  handleStartChange(newStart) {
    this._mergeValue({start: newStart})
  },
  handleEndChange(newEnd) {
    this._mergeValue({end: newEnd})
  },
  showEndTime() {
    this.setState({showEndTime: true})
  },
  removeEndTime() {
    this._mergeValue({end: null})
  },
  _mergeValue(newValue) {
    this._setValue(Object.assign({}, this._getValue() || {}, newValue))
  },
  render() {

    const value = this._getValue() || {}
    const showEndTime = this.state.showEndTime

    return (
      <div>
        <div className="grid">
          <div className="row">
            <div className="span1of2">
              <div className="pick-date-and-time form-group">
                <label className="sub-label">Når begynner det?</label>
                <DateTimePicker value={value.end} onChange={this.handleStartChange}/>
              </div>
            </div>
            <div className="span1of2">
              <div className="pick-date-and-time form-group">
                {value.endTime && (
                  <button style={{float: 'right'}} type="button" onClick={this.removeEndTime}>Fjern
                    slutt-tidspunkt</button>
                )}
                <label className="sub-label">Når slutter det?</label>
                <DateTimePicker value={value.end} onChange={this.handleEndChange}/>
                {!showEndTime && (
                  <div onClick={this.showEndTime} className="overlay add-end-time">
                    Sett slutt-tidspunkt
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
})

export default EventTime
