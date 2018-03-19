import React from 'react'
import PropTypes from 'prop-types'
import ReactTooltip from 'react-tooltip'
import styles from './AuthorAnnotation.css'
import sanityClient from 'part:@sanity/base/client'

export default class AuthorAnnotation extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    _ref: PropTypes.string
  }

  state = {
    author: null
  }

  fetchAuthor() {
    return sanityClient.getDocument(this.props._ref).then(author => {
      this.setState({author: author})
    })
  }

  componentDidUpdate(prevProps) {
    if (prevProps._ref !== this.props._ref) {
      this.fetchAuthor()
    }
  }

  renderToolTip() {
    if (!this.state.author) {
      return null
    }
    return <span>{this.state.author.name}</span>
  }

  render() {
    return (
      <span className={styles.root} data-tip="" data-for="tooltip">
        {this.props.children}
        <ReactTooltip id="tooltip">{this.renderToolTip()}</ReactTooltip>
      </span>
    )
  }
}
