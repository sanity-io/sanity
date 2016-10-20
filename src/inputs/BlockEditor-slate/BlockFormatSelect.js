import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/selects/searchable-style'
import blockFormattingSelectStyles from './styles/BlockFormattingSelect.css'
import {uniqueId, pick} from 'lodash'
import FaAngleDown from 'part:@sanity/base/angle-down-icon'
import DefaultList from 'part:@sanity/components/lists/default'
import enhanceWithClickOutside from 'react-click-outside'
import {SLATE_BLOCK_FORMATTING_OPTION_KEYS, SLATE_LIST_BLOCKS} from './constants'

class SearchableSelect extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    onOpen: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onClose: PropTypes.func,
    value: PropTypes.object,
    label: PropTypes.string,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
      })
    ),
  }

  static defaultProps = {
    onChange() {},
    onBlur() {},
    onFocus() {},
    onOpen() {},
    onClose() {}
  }

  constructor(props, context) {
    super(props, context)
    this.state = {}
  }

  handleClickOutside = () => {
    this.handleCloseList()
  }

  handleFocus = event => {
    this.setState({
      showList: !this.state.showList,
      hasFocus: true
    })

    this.props.onFocus(event)
  }

  handleBlur = event => {
    this.setState({
      hasFocus: false,
      showList: false
    })
    this.props.onBlur(event)
  }

  handleSelect = item => {
    this.props.onChange(item)
    this.handleCloseList()
  }

  handleOpenList = () => {
    this.setState({
      showList: true,
    })
    this.props.onOpen()
  }

  handleCloseList = () => {
    this.setState({
      showList: false
    })
    this.props.onClose()
  }

  handleArrowClick = () => {
    if (this.state.showList) {
      this.handleCloseList()
    } else {
      this.handleOpenList()
    }
  }

  componentWillMount() {
    this._inputId = uniqueId('BlockFormattingSelect')
  }

  renderItem = item => {
    const clickFunc = event => {
      if (item.disabled) {
        event.preventDefault()
        return
      }
      this.handleSelect(item)
    }
    const content = (
      <div className={`${blockFormattingSelectStyles.listItem} ${item.disabled && blockFormattingSelectStyles.disabled}`}>
        <div className={blockFormattingSelectStyles.statusIndicator}>
          {item.isActive
            && <span dangerouslySetInnerHTML={{__html: '&#10003;'}} />}
          {item.isMultiple
            && <span dangerouslySetInnerHTML={{__html: '&ndash;'}} />}
          {!item.isMultiple && !item.isActive
            && <span dangerouslySetInnerHTML={{__html: '&nbsp;'}} />}
        </div>
        <div className={blockFormattingSelectStyles.preview}>
          {item.preview(
            Object.assign(
              {isPreview: true},
              {children: <span>{item.title}</span>},
              pick(item.field, SLATE_BLOCK_FORMATTING_OPTION_KEYS)
            ))
          }
        </div>
      </div>
    )
    return (
      <div onClick={clickFunc}>
        {content}
      </div>
    )
  }

  render() {
    const {value, items} = this.props
    const {showList} = this.state
    return (
      <div className={blockFormattingSelectStyles.root}>
        {this.props.label}
        <div className={`${styles.selectContainer} ${blockFormattingSelectStyles.selectContainer}`}>
          {value && (
            <div onClick={this.handleFocus}>
              {value.preview(
                Object.assign(
                  {isPreview: true},
                  {children: <span>{value.title}</span>},
                  pick(value.field, SLATE_BLOCK_FORMATTING_OPTION_KEYS)
                )
              )}
            </div>
          )}
          <div className={styles.icon} onClick={this.handleArrowClick}>
            <FaAngleDown color="inherit" />
          </div>
        </div>

        <div className={`${showList ? `${styles.listContainer} ${blockFormattingSelectStyles.list}` : styles.listContainerHidden}`}>
          <DefaultList
            items={items}
            renderItem={this.renderItem}
            scrollable
            highlightedItem={value}
            selectedItem={value}
            onSelect={this.handleSelect}
          />
        </div>
      </div>
    )
  }
}

export default enhanceWithClickOutside(SearchableSelect)
