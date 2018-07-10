import PropTypes from 'prop-types'
import React from 'react'
import enhanceClickOutside from 'react-click-outside'
import Menu from 'part:@sanity/components/menus/default'
import styles from './styles/SpaceSwitcher.css'
import {CONFIGURED_SPACES} from '../util/spaces'
import {state as urlState} from '../datastores/urlState'
import {withRouterHOC} from 'part:@sanity/base/router'
import ArrowDropDown from 'part:@sanity/base/arrow-drop-down'
import {map} from 'rxjs/operators'

const currentSpace$ = urlState.pipe(
  map(event => event.state && event.state.space),
  map(spaceName => CONFIGURED_SPACES.find(sp => sp.name === spaceName))
)

class SpaceSwitcher extends React.PureComponent {
  static propTypes = {
    router: PropTypes.shape({navigate: PropTypes.func})
  }

  state = {
    menuOpen: false,
    currentSpace: null
  }

  componentDidMount() {
    this.currentSpaceSubscription = currentSpace$.subscribe(space => {
      this.setState({currentSpace: space})
    })
  }

  componentWillUnmount() {
    this.currentSpaceSubscription.unsubscribe()
  }

  handleClickOutside = () => {
    if (this.state.menuOpen) {
      this.setState({menuOpen: false})
    }
  }

  handleMenuToggle = () => {
    this.setState(prev => ({menuOpen: !prev.menuOpen}))
  }

  handleMenuItemClick = item => {
    this.props.router.navigate({space: item.name})
    this.setState({menuOpen: false})
  }

  render() {
    const {menuOpen, currentSpace} = this.state
    const title = currentSpace && currentSpace.title
    return (
      <div className={styles.root}>
        <div title={title} onClick={this.handleMenuToggle} className={styles.currentSpace}>
          {title && `${title}`}
          <span className={styles.arrow}>
            <ArrowDropDown />
          </span>
        </div>
        {menuOpen && (
          <div className={styles.menu}>
            <Menu
              isOpen
              onAction={this.handleMenuItemClick}
              items={CONFIGURED_SPACES}
              origin="top-right"
              onClickOutside={this.handleMenuClose}
            />
          </div>
        )}
      </div>
    )
  }
}

export default withRouterHOC(enhanceClickOutside(SpaceSwitcher))
