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
    return <a style={{color: 'red'}} href={url} >{this.props.children}</a>
  }
}

Link.propTypes = {
  to: PropTypes.string,
  children: PropTypes.node,
}
