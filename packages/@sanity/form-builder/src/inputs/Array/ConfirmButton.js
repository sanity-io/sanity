import PropTypes from 'prop-types'
import React from 'react'
import Button from 'part:@sanity/components/buttons/default'
import enhanceWithClickOutside from 'react-click-outside'

export default enhanceWithClickOutside(class ConfirmButton extends React.Component {
  static propTypes = {
    children: PropTypes.func,
    onClick: PropTypes.func
  }

  state = {
    doConfirm: false
  }

  handleClickOutside = event => {
    this.setState({doConfirm: false})
  }

  handleClick = event => {
    if (this.state.doConfirm) {
      this.props.onClick(event)
    } else {
      this.setState({doConfirm: true})
    }
  }

  render() {
    const {children, ...rest} = this.props
    const {doConfirm} = this.state
    return (
      <Button
        {...rest}
        onClick={this.handleClick}
      >
        {children(doConfirm)}
      </Button>
    )
  }
})
