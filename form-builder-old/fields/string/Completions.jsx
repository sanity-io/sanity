/* global window */
import React from 'react'
import ReactDOM from 'react-dom'
import cx from 'classnames'

export default React.createClass({

  displayName: 'Completions',

  propTypes: {
    completions: React.PropTypes.array,
    selected: React.PropTypes.number,
    onSelect: React.PropTypes.func
  },

  getInitialState() {
    return {
      open: true,
      touch: typeof window !== 'undefined' && 'ontouchstart' in window
    }
  },

  ensureSelectedVisible() {
    if (!this.refs.list || this.props.selected < 0) { return }
    const list = ReactDOM.findDOMNode(this.refs.list)
    const selected = list.childNodes[this.props.selected]
    const listScrolltop = list.scrollTop
    const listOffsetHeight = list.offsetHeight
    const selectedOffsetHeight = selected.offsetHeight
    const selectedTop = selected.offsetTop - listScrolltop
    list.scrollTop = listScrolltop + selectedTop - listOffsetHeight / 2
      + selectedOffsetHeight / 2
  },

  componentDidUpdate() {
    this.ensureSelectedVisible()
  },

  selectCompletion(text, i) {
    if (this.props.onSelect) {
      this.props.onSelect(text, i)
    }
  },

  render() {
    const {completions} = this.props

    return (
      <div className="auto-complete">
        <ul ref="list" className={cx({
          touch: this.state.touch,
          'auto-complete__result-list': true
        })}>
          {completions.map((text, i) => {
            const handleMouseDown = e => this.selectCompletion(text, i)
            return (
              <li key={i}
                className={cx({
                  'auto-complete__result-item': true,
                  'auto-complete__result-item--selected': this.props.selected == i
                })}
                onMouseDown={handleMouseDown}>
                {text}
              </li>
            )
          })}
        </ul>
      </div>
    )
  }
})
