import PropTypes from 'prop-types'
import React from 'react'
import enhanceClickOutside from 'react-click-outside'
import ChevronDownIcon from 'part:@sanity/base/chevron-down-icon'
import {withRouterHOC} from 'part:@sanity/base/router'
import {map} from 'rxjs/operators'
import {state as urlState} from '../datastores/urlState'
import {CONFIGURED_SPACES} from '../util/spaces'
import styles from './styles/SpaceSwitcher.css'

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

  handleChange = spaceName => {
    this.props.router.navigate({space: spaceName})
    this.setState({menuOpen: false}, () => {
      window.location.reload()
    })
  }

  render() {
    const {currentSpace, isVisible} = this.state
    const tabIndex = isVisible ? '0' : '-1'

    const handleChange = event => {
      this.handleChange(event.target.value)
    }

    return (
      <div aria-hidden={!isVisible} className={styles.root}>
        <select
          onChange={handleChange}
          tabIndex={tabIndex}
          value={(currentSpace && currentSpace.name) || undefined}
        >
          {CONFIGURED_SPACES.map(space => (
            <option key={space.name} value={space.name}>
              {space.title}
            </option>
          ))}
        </select>
        <ChevronDownIcon />
      </div>
    )
  }
}

export default withRouterHOC(enhanceClickOutside(SpaceSwitcher))
