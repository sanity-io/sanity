import React from 'react'
import calendarDate from '../util/calendarDate'

export interface ResultTableProps {
  query: string
  documents?: {
    _id: string
    _type: string
    _updatedAt: string
    _createdAt: string
  }[]
}

export interface ResultTableState {
  expanded: string[]
}

class ResultTable extends React.PureComponent<ResultTableProps, ResultTableState> {
  constructor(props: ResultTableProps) {
    super(props)
    this.state = {expanded: []}
  }

  handleToggleExpandRow(id: string) {
    const expanded = this.state.expanded
    const currentIndex = expanded.indexOf(id)

    if (currentIndex === -1) {
      expanded.push(id)
    } else {
      expanded.splice(currentIndex, 1)
    }
  }

  getExpandRowHandler(id: string) {
    return () => this.handleToggleExpandRow(id)
  }

  isExpanded(id: string) {
    return this.state.expanded.indexOf(id) !== -1
  }

  render() {
    const docs = this.props.documents

    if (!docs || !docs.length) {
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
          {docs.map((doc) => (
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

export default ResultTable
