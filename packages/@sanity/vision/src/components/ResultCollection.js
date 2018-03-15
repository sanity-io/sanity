import React from 'react'
import PropTypes from 'prop-types'
import JsonInspector from 'react-json-inspector'
import JsonDump from './JsonDump'

class ResultCollection extends React.PureComponent {
  constructor(props) {
    super(props)

    this.state = {expanded: []}
  }

  handleToggleExpandRow(id) {
    const expanded = this.state.expanded
    const currentIndex = expanded.indexOf(id)
    if (currentIndex === -1) {
      expanded.push(id)
    } else {
      expanded.splice(currentIndex, 1)
    }
  }

  getExpandRowHandler(id) {
    return () => this.handleToggleExpandRow(id)
  }

  isExpanded(id) {
    return this.state.expanded.indexOf(id) !== -1
  }

  shouldExpand(path, item) {
    // Expand root-level nodes and refs
    return !isNaN(path) || (item && item._ref)
  }

  render() {
    return this.props.viewMode === 'inspect' ? (
      <JsonInspector
        className="vision_result-list"
        data={this.props.data}
        isExpanded={this.shouldExpand}
        search={false}
        filterOptions={{ignoreCase: true}}
      />
    ) : (
      <JsonDump data={this.props.data} />
    )
  }
}

ResultCollection.propTypes = {
  data: PropTypes.oneOfType([PropTypes.object, PropTypes.arrayOf(PropTypes.object)]),
  viewMode: PropTypes.oneOf(['inspector', 'dump'])
}

ResultCollection.defaultProps = {
  viewMode: 'dump'
}

export default ResultCollection
