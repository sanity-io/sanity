import React, {PropTypes} from 'react'
import Pane from 'component:desk-tool/pane'
import equals from 'shallow-equals'
import QueryContainer from 'component:@sanity/base/query-container'

function mapProps(props) {
  const {result, ...rest} = props
  return {
    items: result ? result.documents : [],
    ...rest
  }
}

class QueryPane extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    return !equals(this.props, nextProps) || !equals(this.state, nextState)
  }

  render() {
    const {query, ...rest} = this.props
    return (
      <QueryContainer query={query} mapFn={mapProps}>
        <Pane {...rest} />
      </QueryContainer>
    )
  }
}

QueryPane.propTypes = {
  loading: PropTypes.bool,
  query: PropTypes.string.isRequired,
  activeItem: PropTypes.any,
  basePath: PropTypes.string
}

export default QueryPane
