import React from 'react'
import PropTypes from 'prop-types'
import calendarDate from '../util/calendarDate'

class ResultTable extends React.PureComponent {
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

  render() {
    const docs = this.props.documents
    if (!docs.length) {
      return (
        <div className="no-results">
          <p>No results found for query:</p>
          <code>{this.props.query}</code>
        </div>
      )
    }

    return (
      <table className="pure-table pure-table-striped vision_result-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th title="All dates in UTC">Last modified</th>
            <th title="All dates in UTC">Created</th>
          </tr>
        </thead>
        <tbody>
          {docs.map(doc => (
            <tr key={doc._id} onClick={this.getExpandRowHandler(doc._id)}>
              <td>{doc._id}</td>
              <td>{doc._type}</td>
              <td>{calendarDate(doc._updatedAt)}</td>
              <td>{calendarDate(doc._createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }
}

ResultTable.propTypes = {
  query: PropTypes.string.isRequired,
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      _type: PropTypes.string.isRequired,
      _updatedAt: PropTypes.string.isRequired,
      _createdAt: PropTypes.string.isRequired
    })
  )
}

export default ResultTable
