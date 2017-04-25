import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/selects/style-style'
import {uniqueId, includes} from 'lodash'
import FaAngleDown from 'part:@sanity/base/angle-down-icon'
import DefaultFormField from 'part:@sanity/components/formfields/default'
import enhanceWithClickOutside from 'react-click-outside'
import CircleThinIcon from 'part:@sanity/base/circle-thin-icon'
import CircleCheckIcon from 'part:@sanity/base/circle-check-icon'

class StyleSelect extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    placeholder: PropTypes.string,
    onChange: PropTypes.func,
    onOpen: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onClose: PropTypes.func,
    value: PropTypes.array,
    error: PropTypes.bool,
    renderItem: PropTypes.func,
    className: PropTypes.string,
    transparent: PropTypes.bool,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        active: PropTypes.bool
      })
    ),
  }

  static defaultProps = {
    placeholder: 'Type to search…',
    loading: false,
    className: '',
    onChange() {},
    onBlur() {},
    onOpen() {},
    onClose() {}
  }

  constructor(props, context) {
    super(props, context)

    this.state = {
      hasFocus: false,
      inputValue: this.props.value && this.props.value.title,
      inputSelected: false,
      arrowNavigationPosition: 0
    }
  }

  handleClickOutside = () => {
    this.handleCloseList()
  }

  // componentWillReceiveProps(nextProps) {
  //   if (nextProps.items != this.props.items) {
  //     this.setState({
  //       searchResult: this.props.items,
  //       showList: true
  //     })
  //   }
  //   if (nextProps.value != this.props.value) {
  //     this.setState({
  //       inputValue: nextProps.value.title,
  //       inputSelected: true,
  //       value: nextProps.value.title,
  //       showList: false
  //     })
  //   }
  // }

  handleFocus = event => {
    this.setState({
      hasFocus: true,
      inputSelected: true
    })

    this.props.onFocus(event)
  }

  handleBlur = event => {
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

  handleInnerClick = () => {
    if (this.state.showList) {
      this.handleCloseList()
    } else {
      this.handleOpenList()
    }
  }


  handleKeyDown = event => {
    const {items} = this.props
    const {arrowNavigationPosition} = this.state
    if (items) {
      if (event.key == 'ArrowUp' && arrowNavigationPosition > 0) {
        this.setState({
          arrowNavigationPosition: arrowNavigationPosition - 1,
          inputValue: items[arrowNavigationPosition - 1].title,
          showList: true
        })
        return false
      }

      if (event.key == 'ArrowDown' && arrowNavigationPosition < items.length - 1) {
        this.setState({
          arrowNavigationPosition: arrowNavigationPosition + 1,
          inputValue: items[arrowNavigationPosition + 1].title,
          showList: true
        })
        return false
      }
    }
    return true
  }

  handleKeyUp = event => {
    const {items} = this.props
    const {arrowNavigationPosition} = this.state
    if (event.key == 'Enter' && arrowNavigationPosition) {
      this.handleSelect(items[arrowNavigationPosition])
      this.setState({
        hasFocus: false
      })
      return false
    }
    return true
  }

  componentWillMount() {
    this._inputId = uniqueId('CustomSelect')
  }

  render() {
    const {label, error, value, description, items, className, transparent, placeholder} = this.props
    const {hasFocus, showList} = this.state


    return (
      <DefaultFormField
        className={`
          ${styles.root}
          ${hasFocus ? styles.focused : ''}
          ${error ? styles.error : ''}
          ${transparent ? styles.transparent : ''}
          ${className || ''}
        `}
        description={description}
        labelHtmlFor={this._inputId}
        label={label}
      >
        <div className={styles.inner} onClick={this.handleInnerClick}>
          <div className={styles.selectContainer}>
            <span className={styles.text}>
              {value && value.length > 1 && 'Multiple'}
              {value && value.length == 1 && value[0].title}
              {!value && placeholder}
            </span>
            <div className={styles.icon}>
              <FaAngleDown color="inherit" />
            </div>
          </div>
        </div>

        <div className={`${showList ? styles.listContainer : styles.listContainerHidden}`}>
          {
            items.map(item => {
              const isSemiSelected = value && value.length > 1 && includes(value, item)
              const isSelected = value && value.length === 1 && value[0] == item
              const classNames = `
                ${isSelected ? styles.itemSelected : styles.item}
                ${isSemiSelected ? styles.itemSemiSelected : ''}
              `
              return (
                <a className={classNames} key={item.key} title={item.title} onClick={() => this.handleSelect(item)}>
                  <div className={styles.itemIcon}>
                    {
                      isSelected && <CircleCheckIcon />
                    }
                    {
                      isSemiSelected && <CircleThinIcon />
                    }
                  </div>
                  <div className={styles.itemContent}>
                    {this.props.renderItem(item)}
                  </div>
                </a>
              )
            })
          }
        </div>
      </DefaultFormField>
    )
  }
}

export default enhanceWithClickOutside(StyleSelect)
