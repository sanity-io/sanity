/* eslint-disable complexity */
import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {get} from 'lodash'
import SearchIcon from 'part:@sanity/base/search-icon'
import Spinner from 'part:@sanity/components/loading/spinner'
import {isKeyHotkey} from 'is-hotkey'
import Hotkeys from 'part:@sanity/components/typography/hotkeys'
import Poppable from 'part:@sanity/components/utilities/poppable'
import styles from './styles/Search.css'

function isParentOf(possibleParent, possibleChild) {
  let current = possibleChild
  while (current) {
    if (current === possibleParent) {
      return true
    }
    current = current.parentNode
  }
  return false
}

class SearchWidget extends React.PureComponent {
  static propTypes = {
    isSearching: PropTypes.bool,
    hits: PropTypes.arrayOf(
      PropTypes.shape({
        index: PropTypes.number,
        _id: PropTypes.string
      })
    ),
    isOpen: PropTypes.bool,
    inputValue: PropTypes.string,
    renderItem: PropTypes.func.isRequired,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    onInputChange: PropTypes.func.isRequired,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onKeyDown: PropTypes.func,
    activeIndex: PropTypes.number
  }

  static defaultProps = {
    hits: [],
    isOpen: false,
    inputValue: undefined,
    onOpen: () => {},
    onClose: () => {},
    onFocus: () => {},
    onBlur: () => {},
    onKeyDown: () => {},
    activeIndex: undefined
  }

  componentDidMount() {
    if (window) {
      window.addEventListener('keydown', this.handleWindowKeyDown)
    }
  }

  componentWillUnmount() {
    if (window) {
      window.removeEventListener('keydown', this.handleWindowKeyDown)
    }
  }

  handleInputChange = event => {
    this.props.onInputChange(event)
  }

  handleInputClick = el => {
    // this.props.onClose()
  }

  handleFocus = el => {
    this.props.onFocus()
  }

  handleBlur = event => {
    if (!isParentOf(this.rootElement, event.target)) {
      this.props.onBlur()
    }
  }

  setInput = el => {
    this.inputElement = el
  }

  setListElement = el => {
    this.listElement = el
  }

  setRootElement = el => {
    this.rootElement = el
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.isOpen && this.props.isOpen) {
      this.inputElement.select()
    }
  }

  handleEscape = () => {
    this.props.onClose()
  }

  handleClickOutside = () => {
    this.props.onClose()
  }

  handleWindowKeyDown = event => {
    const isOpenSearch = isKeyHotkey('ctrl+t')
    if (isOpenSearch(event)) {
      this.props.onOpen()
      event.preventDefault()
      event.stopPropagation()
    }
  }

  handleKeyDown = event => {
    const {activeIndex} = this.props

    if (event.key === 'Enter') {
      this.listElement.querySelector(`[data-hit-index="${activeIndex}"]`).click()
    }

    this.props.onKeyDown(event)
  }

  render() {
    const {isSearching, hits, isOpen, inputValue, renderItem, activeIndex} = this.props
    const isResultShowing = Boolean(isOpen && (inputValue || isSearching || hits > 0))
    return (
      <div
        className={styles.root}
        ref={this.setRootElement}
        data-is-result-showing={isResultShowing}
      >
        <Poppable
          referenceClassName={styles.inner}
          onEscape={this.handleEscape}
          onClickOutside={this.handleClickOutside}
          modifiers={{
            preventOverflow: {
              boundariesElement: 'viewport'
            },
            customStyle: {
              enabled: true,
              fn: data => {
                const width = get(data, 'instance.reference.clientWidth') || 500
                data.styles = {
                  ...data.styles,
                  width: width
                }
                return data
              }
            }
          }}
          target={
            <Fragment>
              <label className={styles.label}>
                <SearchIcon />
              </label>
              <input
                className={styles.input}
                type="search"
                value={isOpen ? inputValue : ''}
                onChange={this.handleInputChange}
                onBlur={this.handleBlur}
                onClick={this.handleInputClick}
                onFocus={this.handleFocus}
                onKeyDown={this.handleKeyDown}
                placeholder="Search"
                ref={this.setInput}
              />
              <div className={styles.hotkeys}>
                {/* <Hotkeys keys={['Ctrl', 'Alt', 'T']} /> */}
                <Hotkeys keys={['F']} />
              </div>
            </Fragment>
          }
        >
          {isResultShowing && (
            <div className={styles.result}>
              <div className={styles.spinner}>{isSearching && <Spinner />}</div>
              {inputValue &&
                !isSearching &&
                (!hits || hits.length === 0) && (
                  <div className={styles.noHits}>
                    Could not find <strong>&ldquo;{inputValue}&rdquo;</strong>
                  </div>
                )}
              {!isSearching &&
                hits &&
                hits.length > 0 && (
                  <div className={styles.listContainer}>
                    <ul className={styles.hits} ref={this.setListElement}>
                      {hits.map((hit, index) => (
                        <li key={hit._id} className={styles.hit}>
                          {renderItem(hit, index, activeIndex)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}
        </Poppable>
      </div>
    )
  }
}

export default SearchWidget
