// This is the legacy auto-complete field for backwards compatibility. It is
// not utilizing the AutocompleteStore-infrastructure.

/* global window */
import React from 'react'
import ClickOutsideMixin from './../mixins/ClickOutsideMixin'
import BEMhelper from 'react-bem-helper'

export default React.createClass({
  mixins: [ClickOutsideMixin],

  getInitialState() {
    return {
      highlightedIndex: -1,
      selected: null,
      touch: false,
      doneTypingInterval: 300,
      open: false
    }
  },

  componentWillMount() {
    this.typingTimer = null
  },

  componentDidMount() {
    if (typeof window !== 'undefined' && 'ontouchstart' in window) {
      this.setState({touch: true})
    }
  },

  componentWillUnmount() {
    clearTimeout(this.typingTimer)
    this.typingTimer = null
  },

  handleOutsideClick(e) {
    this.setState({open: false})
  },

  ensureHighlightedVisible() {
    if (!this.refs.list || this.state.highlightedIndex < 0) { return }
    const self = this
    const list = this.refs.list
    const children = list.childNodes
    let highlighted
    for (let i = 0; i < children.length; i++) {
      if (i === self.state.highlightedIndex) {
        highlighted = children[i]
      }
    }
    if (!(list && highlighted)) { return }

    const listScrolltop = list.scrollTop
    const listOffsetHeight = list.offsetHeight
    const highlightedOffsetHeight = highlighted.offsetHeight
    const highlightedTop = highlighted.offsetTop - listScrolltop
    list.scrollTop = listScrolltop + highlightedTop - listOffsetHeight / 2 + highlightedOffsetHeight / 2
  },

  openListButtonClicked() {
    this.setState({open: true})
  },

  onKeyUp(event) {
    clearTimeout(this.typingTimer)
  },

  onKeyDown(event) {
    const code = event.keyCode
    let highlightedIndex = this.state.highlightedIndex

    switch (code) {
      // case 9:
      //   this.selectItem(event, this.props.suggestions[highlightedIndex]);
      //   break;
      case 13:
        this.selectItem(event, this.props.suggestions[highlightedIndex])
        break
      case 40:
        if (highlightedIndex < this.props.suggestions.length - 1) { highlightedIndex += 1 }
        break
      case 27:
        if (this.props.suggestions && this.props.suggestions.length > 0) {
          this.setState({open: false})
        } else {
          this.clearField()
        }
        break
      case 38:
        if (highlightedIndex > -1) { highlightedIndex -= 1 }
        break
      default:
        // noop
        break
    }

    this.setState({highlightedIndex: highlightedIndex, highlighetdItem: this.props.suggestions[highlightedIndex]})

    if (highlightedIndex > -1) { this.ensureHighlightedVisible() }

    if (code === 13 || code === 40 || code === 38) {
      event.preventDefault()
      event.stopPropagation()
    }
  },

  onChange(event) {
    if (this.props.onChange) {
      this.setState({open: true})
      this.props.onChange(event, this.refs.searchInput.value)
    }
  },

  onBlur(event) {
    this.setState({open: false})
  },

  resetListScroll() {
    if (this.refs.list) {
      this.refs.list.scrollTop = 0
    }
  },

  clearField() {
    this.resetListScroll()
    this.refs.searchInput.value = ''
    this.refs.searchInput.focus()
    this.setState({selected: null})
    if (this.props.onReset) {
      this.props.onReset()
    }
  },

  selectItem(event, item) {
    if (this.props.onSelect) {
      this.props.onSelect(event, item)
    }
    if (event.isPropagationStopped()) {
      this.setState({selected: item})
      return
    }
    if (item) {
      this.resetListScroll()
      this.setState({selected: item, highlightedIndex: -1, highlighetdItem: null})
      this.refs.searchInput.value = item.value
      this.onChange(event)
    }
  },

  render() {
    const state = this.state

    const classes = new BEMhelper({
      name: 'auto-complete'
    })

    const suggestions = this.props.suggestions

    return (
      <div {...classes()}>
        <input
          {...classes('input', [this.state.open ? 'open' : 'closed'])}
          autoComplete="off"
          name={this.props.fieldName}
          ref="searchInput"
          id={'autoComplete--' + this.props.fieldName}
          type={this.props.type || 'text'}
          size={this.props.size || 50}
          onKeyDown={this.onKeyDown}
          onKeyUp={this.onKeyUp}
          onChange={this.onChange}
          onBlur={this.onBlur}
          defaultValue={this.props.defaultValue} />
        <button
          tabIndex="-1"
          type="button"
          {...classes('open-button')}
          onClick={this.openListButtonClicked}
        >
          <i className="ion ion-chevron-down"/>
        </button>
        <div {...classes('clear-button')} onClick={this.clearField}/>
        <div {...classes('result', [this.state.open ? 'open' : 'closed'])}>
          <ul ref="list" {...classes('result-list')}>
            {suggestions.map((item, i) => {
              const selectItem = e => this.selectItem(e, item)
              return (
                <li key={i}
                  {...classes('result-item', [
                    state.highlightedIndex === 1 ? 'active' : '',
                    item.isMatch ? 'match' : 'no-match'
                  ])}
                  onMouseDown={selectItem}
                  data-value={item.value}>{item.value}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    )
  }
})
