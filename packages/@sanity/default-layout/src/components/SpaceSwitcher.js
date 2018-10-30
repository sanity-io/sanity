import PropTypes from 'prop-types'
import React from 'react'
import enhanceClickOutside from 'react-click-outside'
import {withRouterHOC} from 'part:@sanity/base/router'
import {map} from 'rxjs/operators'
import DefaultSelect from 'part:@sanity/components/selects/default'
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

  handleChange = item => {
    this.props.router.navigate({space: item.name})
    this.setState({menuOpen: false})
  }

  render() {
    const {currentSpace} = this.state
    return (
      <div className={styles.root}>
        <DefaultSelect
          onChange={this.handleChange}
          items={CONFIGURED_SPACES}
          value={currentSpace}
        />
      </div>
    )
  }
}

export default withRouterHOC(enhanceClickOutside(SpaceSwitcher))
