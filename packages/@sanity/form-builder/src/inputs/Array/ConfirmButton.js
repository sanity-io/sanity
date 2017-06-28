import PropTypes from 'prop-types'
import React from 'react'
import Button from 'part:@sanity/components/buttons/default'
import enhanceWithClickOutside from 'react-click-outside'

export default enhanceWithClickOutside(class ConfirmButton extends React.Component {
  static propTypes = {
    icon: PropTypes.node,
    confirmIcon: PropTypes.node,
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
    const {icon, confirmIcon, children, ...rest} = this.props
    const {doConfirm} = this.state
    return (
      <Button
        {...rest}
        icon={doConfirm ? confirmIcon : icon}
        onClick={this.handleClick}
      >
        {children(doConfirm)}
      </Button>
    )
  }
})
