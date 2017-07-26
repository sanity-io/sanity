import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/globalsearch/default-style'
import SearchIcon from 'part:@sanity/base/search-icon'
import Spinner from 'part:@sanity/components/loading/spinner'
import enhanceWithClickOutside from 'react-click-outside'

class GlobalSearch extends React.Component {
  static propTypes = {
    onSearch: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    items: PropTypes.array, // eslint-disable-line
    topItems: PropTypes.array, // eslint-disable-line
    renderItem: PropTypes.func, // props: item, {options}
    isOpen: PropTypes.bool,
    isSearching: PropTypes.bool,
    label: PropTypes.string,
    placeholder: PropTypes.string,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onClose: PropTypes.func,
    listContainerClassName: PropTypes.string
  }

  static defaultProps = {
    isOpen: false,
    isSearching: false,
    label: 'Search',
    placeholder: '',
    onChange() {},
    onClose() {},
    onBlur() {},
    renderItem() {},
    onFocus() {},
    topItems: [],
    items: []
  }

  state = {
    selectedItem: null
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown, true)
    this.setState({
      hasFocus: true
    })
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown, true)
  }

  handleClickOutside = () => {
    this.props.onClose()
  }

  setFocus = () => {
    this.props.onFocus()
    this.inputElement.focus()
    if (this.inputElement.value !== '') {
      this.inputElement.select()
    }
  }

  setBlur = () => {
    this.props.onBlur()
    this.inputElement.blur()
    this.props.onClose()
  }

  setInputElement = element => {
    this.inputElement = element
  }

  handleKeyDown = event => {
    const trigger
       = (event.key === 'F' && event.shiftKey && event.metaKey)
      || (event.key === 'S' && event.shiftKey && event.metaKey)
      || (event.key === 'F' && event.shiftKey && event.ctrlKey)
      || (event.key === 'S' && event.shiftKey && event.ctrlKey)


    if (trigger && !this.state.isOpen) {
      this.setFocus()
    }

    if (trigger && this.state.isOpen) {
      this.onClose()
    }

    if (event.key === 'Escape') {
      this.setBlur()
    }

    if (this.props.isOpen) {
      if (event.key === 'Enter') {
        this.handlePressEnter()
      }
      if (event.key === 'ArrowDown') {
        this.handleArrowDown()
        event.preventDefault()
      }
      if (event.key === 'ArrowUp') {
        this.handleArrowUp()
        event.preventDefault()
      }
    }
  }

  handleArrowUp() {
    const {topItems, items} = this.props
    const {selectedItem} = this.state

    // Concat both list to control index
    const allItems = topItems.concat(items)

    // select first
    if (!selectedItem && topItems) {
      this.setState({
        selectedItem: topItems && topItems[0]
      })
    }

    const currentIndex = allItems.indexOf(selectedItem)


    if (selectedItem && currentIndex > 0) {
      this.setState({
        selectedItem: allItems[currentIndex - 1]
      })
    }

    // select last
    if (!selectedItem && currentIndex < 0) {
      this.setState({
        selectedItem: allItems[allItems.length - 1]
      })
    }
  }

  handleArrowDown() {
    const {topItems, items} = this.props
    const {selectedItem} = this.state

    // Concat both list to control index
    const allItems = items.concat(topItems)

    // select first
    if (!selectedItem) {
      this.setState({
        selectedItem: (items && items[0]) || (topItems && topItems[0])
      })
    }

    const currentIndex = allItems.indexOf(selectedItem)

    if (selectedItem && currentIndex >= 0 && currentIndex < allItems.length - 1) {
      this.setState({
        selectedItem: allItems[currentIndex + 1]
      })
    }
  }

  handlePressEnter = () => {
    const {selectedItem} = this.state
    if (selectedItem) {
      this.handleChange(selectedItem)
    }
  }

  handleInputChange = event => {
    const query = event.target.value
    this.setState({
      inputValue: query
    })
    this.props.onSearch(query)
  }

  handleItemClick = item => {
    this.handleChange(item)
  }

  handleChange = item => {
    this.setState({selectedItem: null})
    this.props.onChange(item)
  }

  render() {
    const {topItems, items, isOpen, label, placeholder, isSearching, renderItem, listContainerClassName} = this.props
    const {selectedItem} = this.state
    return (
      <div className={styles.root}>
        <div className={styles.inner}>
          <label className={styles.label}>
            <i className={styles.icon} aria-hidden="true">
              <SearchIcon />
            </i>
            <span className={styles.labelText}>Search</span>
          </label>
          <input
            className={styles.input}
            type="search"
            onChange={this.handleInputChange}
            onFocus={this.props.onFocus}
            placeholder={placeholder}
            ref={this.setInputElement}
          />
          <div className={styles.spinner}>
            {isSearching && <Spinner />}
          </div>
        </div>
        {
          (!items || items.length == 0) && isOpen && <div>No result</div>
        }
        {
          ((topItems && topItems.length > 0) || (items && items.length > 0)) && (
            <div className={isOpen ? `${styles.listContainer} ${listContainerClassName || ''}` : styles.listContainerClosed}>
              <ul className={styles.items}>
                {
                  items && items.length > 0 && items.map((item, i) => {
                    return (
                      <li
                        key={item._id}
                        onClick={this.handleItemClick.bind(null, item)}
                        className={selectedItem === item ? styles.selectedItem : styles.item}
                      >
                        {renderItem(item)}
                      </li>
                    )
                  })
                }
                {
                  topItems && topItems.length > 0 && topItems.map((item, i) => {
                    return (
                      <li
                        key={`topitem${i}`}
                        onClick={this.handleItemClick.bind(null, item)}
                        className={selectedItem === item ? styles.selectedTopItem : styles.topItem}
                      >
                        {renderItem(item, {isTopItem: true})}
                      </li>
                    )
                  })
                }

              </ul>
            </div>
          )
        }
      </div>
    )
  }
}

export default enhanceWithClickOutside(GlobalSearch)
