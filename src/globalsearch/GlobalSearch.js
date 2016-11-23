import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/globalsearch/default-style'
import SearchIcon from 'part:@sanity/base/search-icon'
import Spinner from 'part:@sanity/components/loading/spinner'
import enhanceWithClickOutside from 'react-click-outside'

class GlobalSearch extends React.Component {
  static propTypes = {
    onSearch: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    topItems: PropTypes.array,
    items: PropTypes.array,
    renderItem: PropTypes.func, // props: item, {options}
    isOpen: PropTypes.bool,
    isSearching: PropTypes.bool,
    label: PropTypes.string,
    placeholder: PropTypes.string,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onClose: PropTypes.func
  }

  static defaultProps = {
    isOpen: false,
    isSearching: false,
    label: 'Search',
    placeholder: '',
    onClose() {},
    onBlur() {},
    renderItem() {},
    onFocus() {},
    topItems: [],
    items: []
  }

  constructor(props) {
    super(props)

    this.state = {
      selectedItem: null
    }
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

  onSearch = query => {
    this.props.onSearch()
  }

  setFocus = () => {
    this.props.onFocus()
    this.inputElement.focus()
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


    if (trigger) {
      this.setFocus()
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

    const allItems = topItems.concat(items)

    // select first
    if (!selectedItem) {
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
  }

  handleArrowDown() {
    const {topItems, items} = this.props
    const {selectedItem} = this.state

    const allItems = topItems.concat(items)

    // select first
    if (!selectedItem) {
      this.setState({
        selectedItem: (topItems && topItems[0]) || (items && items[0])
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
    this.props.onChange(item)
  }

  render() {
    const {topItems, items, isOpen, label, placeholder, isSearching, renderItem} = this.props
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
            placeholder={placeholder}
            ref={this.setInputElement}
          />
          <div className={styles.spinner}>
            {isSearching && <Spinner />}
          </div>
        </div>
        {
          ((topItems && topItems.length > 0) || (items && items.length > 0)) && (
            <div className={isOpen ? styles.listContainer : styles.listContainerClosed}>
              <ul className={styles.items}>
                {
                  topItems && topItems.length > 0 && topItems.map((item, i) => {
                    return (
                      <li
                        onClick={this.handleItemClick.bind(null, item)}
                        key={`topitem${i}`}
                        className={selectedItem === item ? styles.selectedTopItem : styles.topItem}
                      >
                        {renderItem(item, {isTopItem: true})}
                      </li>
                    )
                  })
                }
                {
                  items && items.length > 0 && items.map((item, i) => {
                    return (
                      <li
                        onClick={this.handleItemClick.bind(null, item)}
                        key={`topitem${i}`}
                        className={selectedItem === item ? styles.selectedItem : styles.item}
                      >
                        {renderItem(item)}
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
