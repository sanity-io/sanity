import React, {PropTypes} from 'react'
import Pane from './Pane'
import styles from '../../styles/DeskTool.css'

class QueryPane extends React.Component {
  constructor() {
    super()

    this.state = {
      loading: true
    }
  }

  componentDidMount() {
    setTimeout(() => this.setState({
      loading: false,
      items: (new Array(15)).join('.').split('.').map((item, index) => ({title: '(' + this.props.previousPathSegment + ') Item ' + index, pathSegment: index}))
    }), 750)
  }

  render() {
    return (
      <Pane
        items={this.state.items}
        loading={this.state.loading}
        activeItem={this.props.activeItem}
      />
    )
  }
}

QueryPane.propTypes = {
  loading: PropTypes.bool,
  items: PropTypes.array,
  activeItem: PropTypes.any,
  previousPathSegment: PropTypes.string
}

export default QueryPane
