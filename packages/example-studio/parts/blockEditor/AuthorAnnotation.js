import React from 'react'
import PropTypes from 'prop-types'
import ReactTooltip from 'react-tooltip'
import styles from './AuthorAnnotation.css'
import sanityClient from 'part:@sanity/base/client'

export default class AuthorAnnotation extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    _ref: PropTypes.string,
    _key: PropTypes.string
  }

  state = {
    author: null
  }

  fetchAuthor() {
    if (this.props._ref) {
      return sanityClient.getDocument(this.props._ref).then(author => {
        this.setState({author: author})
      })
    }
  }

  componentDidMount() {
    this.fetchAuthor()
  }

  componentDidUpdate(prevProps) {
    if (this.props._ref && prevProps._ref !== this.props._ref) {
      this.fetchAuthor()
    }
  }

  renderToolTip(toolTipId) {
    if (!this.state.author) {
      return null
    }
    return (
      <ReactTooltip className={styles.reactToolTip} id={toolTipId}>
        {this.state.author.name}
      </ReactTooltip>
    )
  }

  render() {
    const toolTipId = `tooltip${this.props._key}`
    return (
      <span className={styles.root} data-tip="" data-for={toolTipId}>
        {this.props.children}
        {this.renderToolTip(toolTipId)}
      </span>
    )
  }
}
