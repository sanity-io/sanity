import React, {PropTypes} from 'react'
import ToggleButton from 'part:@sanity/components/toggles/button'

import LinkIcon from 'part:@sanity/base/sanity-logo-icon'
import EditItemPopOver from 'part:@sanity/components/edititem/popover'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'

import styles from './styles/LinkButton.css'

export default class LinkButton extends React.Component {

  static propTypes = {
    onClick: PropTypes.func,
    activeLink: PropTypes.shape({
      href: PropTypes.string,
      target: PropTypes.string
    })
  }

  constructor(props) {
    super(props)
    this.state = {href: '', target: '_blank', popupOpen: false}
  }

  linkDataFromProps() {
    return {
      href: this.props.activeLink ? this.props.activeLink.href : '',
      target: this.props.activeLink ? this.props.activeLink.target : '_blank',
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.linkDataFromProps())
  }

  handleChange = event => {
    const value = event.target.value
    this.setState({href: value})
  }

  handleToggleButtonClick = () => {
    this.setState({popupOpen: true})
  }

  handleEditItemOnClose = () => {
    this.props.onClick(this.state.href, this.state.target)
    this.setState(
      Object.assign(
        {popupOpen: false},
        this.linkDataFromProps()
      )
    )
  }

  render() {
    return (
      <div style={{position: 'relative'}}>
        <ToggleButton
          onClick={this.handleToggleButtonClick}
          selected={!!this.props.activeLink}
          title={'Link'}
          className={styles.button}
        >
          <div className={styles.iconContainer}>
            <LinkIcon />
          </div>
        </ToggleButton>

        { this.state.popupOpen
          && (
            <EditItemPopOver
              title="Edit this item"
              onClose={this.handleEditItemOnClose}
              scrollContainerId="slateEditorLinkScrollContainer"
            >
              <DefaultTextInput
                placeholder="Enter a URL here"
                onChange={this.handleChange}
                value={this.state.href}
                id="slateEditorLinkInputField"
              />
            </EditItemPopOver>
          )
        }

      </div>
    )
  }
}
