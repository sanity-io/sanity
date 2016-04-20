import locationStore from 'datastore:@sanity/base/toolLocation'
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

  componentWillReceiveProps(nextProps) {
    if (this.props.to !== nextProps.to) {
      this.resubscribe()
    }
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  resubscribe() {
    this.unsubscribe()
    this.subscribe()
  }

  subscribe() {
    this.subscription = locationStore
      .urlTo(this.props.to)
      .subscribe({
        next: url => {
          this.setState({href: url})
        }
      })
  }

  unsubscribe() {
    this.subscription.unsubscribe()
  }

  handleClick(e) {
    e.preventDefault()
    locationStore.actions.navigate(this.state.href)
  }

  render() {
    const {href} = this.state
    return <a {...this.props} href={href} onClick={this.handleClick} />
  }
}

Link.propTypes = {
  to: PropTypes.string.isRequired,
  children: PropTypes.node
}
