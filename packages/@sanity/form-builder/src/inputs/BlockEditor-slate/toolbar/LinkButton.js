import React, {PropTypes} from 'react'
import ToggleButton from 'part:@sanity/components/toggles/button'

import LinkIcon from 'part:@sanity/base/link-icon'
import styles from './styles/LinkButton.css'

export default class LinkButton extends React.Component {

  static propTypes = {
    createLink: PropTypes.func,
    activeLink: PropTypes.node
  }

  handleToggleButtonClick = () => {
    if (this.props.activeLink) {
      this.props.activeLink.removeLink()
      return
    }
    this.props.createLink()
  }

  render() {
    const {activeLink} = this.props
    return (
      <div style={{position: 'relative'}}>
        <ToggleButton
          onClick={this.handleToggleButtonClick}
          title={'Link'}
          selected={activeLink}
          className={styles.button}
        >
          <div className={styles.iconContainer}>
            <LinkIcon />
          </div>
        </ToggleButton>

      </div>
    )
  }
}
