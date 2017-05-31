import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/selects/custom-style'
import {uniqueId} from 'lodash'
import DefaultFormField from 'part:@sanity/components/formfields/default'
import enhanceWithClickOutside from 'react-click-outside'
import CustomSelect from 'part:@sanity/components/selects/custom'

class CustomSelectField extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    onChange: PropTypes.func,
    onOpen: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onClose: PropTypes.func,
    value: PropTypes.object,
    error: PropTypes.bool,
    renderItem: PropTypes.func,
    className: PropTypes.string,
    transparent: PropTypes.bool,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
      })
    ),
  }

  static defaultProps = {
    placeholder: 'Type to search…',
    loading: false,
    onChange() {},
    onBlur() {},
    onOpen() {},
    onClose() {}
  }

  state = {
    hasFocus: false,
    inputSelected: false,
    arrowNavigationPosition: 0
  }

  handleClickOutside = () => {
    this.handleCloseList()
  }

  handleFocus = event => {
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

  componentWillMount() {
    this._inputId = uniqueId('CustomSelect')
  }

  render() {
    const {label, error, description, className, transparent} = this.props
    const {hasFocus} = this.state

    return (
      <DefaultFormField
        className={`
          ${styles.root}
          ${hasFocus && styles.focused}
          ${error && styles.error}
          ${transparent && styles.transparent}
          ${className}`}
        description={description}
        labelHtmlFor={this._inputId}
        label={label}
      >
        <CustomSelect {...this.props} inputId={this._inputId} />
      </DefaultFormField>
    )
  }
}

export default enhanceWithClickOutside(CustomSelectField)
