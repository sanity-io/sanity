import router from 'router:@sanity/base'
import React, {PropTypes} from 'react'

export default class Link extends React.Component {
  constructor() {
    super()
    this.state = {}
  }
  componentWillMount() {
    router.urlTo(this.props.to).forEach(url => {
      this.setState({url: url})
    })
  }
  render() {
    const {url} = this.state
    return <a href={url} >{this.props.children}</a>
  }
}

Link.contextTypes = {
  router: PropTypes.object
}
