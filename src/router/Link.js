import locationStore from 'datastore:@sanity/base/location'
import React, {PropTypes} from 'react'

export default class Link extends React.Component {
  constructor() {
    super()
    this.state = {href: null}
    this.handleClick = this.handleClick.bind(this)
  }

  componentDidMount() {
    this.subscribe()
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  subscribe() {
    this.subscription = locationStore.state
      .map(event => event.location)
      .subscribe({
        next: location => {
          this.setState({location: location})
        }
      })
  }

  unsubscribe() {
    this.subscription.unsubscribe()
  }

  handleClick(e) {
    e.preventDefault()
    locationStore.actions.navigate(this.getHrefInContext())
  }

  getHrefInContext() {
    const {parentRouter} = this.context
    return parentRouter.urlTo(this.props.to)
  }

  render() {
    const href = this.getHrefInContext()
    return <a {...this.props} href={href} onClick={this.handleClick} />
  }
}

Link.contextTypes = {
  parentRouter: PropTypes.object
}

Link.propTypes = {
  to: PropTypes.string.isRequired,
  children: PropTypes.node
}
