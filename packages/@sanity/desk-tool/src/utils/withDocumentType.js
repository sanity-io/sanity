import React from 'react'
import PropTypes from 'prop-types'
import client from 'part:@sanity/base/client'
import LoadingPane from '../pane/LoadingPane'
import ErrorPane from '../pane/ErrorPane'

// Resolves the type for a document if not present
export default function withDocument(Pane) {
  return class WithDocumentType extends React.PureComponent {
    static displayName = `withDocumentType(${Pane.displayName || Pane.name})`

    static propTypes = {
      isSelected: PropTypes.bool.isRequired,
      isCollapsed: PropTypes.bool.isRequired,
      onExpand: PropTypes.func,
      onCollapse: PropTypes.func,
      path: PropTypes.arrayOf(PropTypes.string),
      options: PropTypes.shape({
        id: PropTypes.string.isRequired,
        type: PropTypes.string
      }).isRequired
    }

    static defaultProps = {
      path: [],
      onExpand: undefined,
      onCollapse: undefined
    }

    constructor(props) {
      super(props)

      const {id, type} = props.options
      this.state = {type: type || undefined}

      if (!type) {
        this.subscription = client.observable
          .fetch('*[_id == $id][0]._type', {id})
          .subscribe(schemaType => this.setState({type: schemaType}))
      }
    }

    componentWillUnmount() {
      if (this.subscription) {
        this.subscription.unsubscribe()
      }
    }

    render() {
      const type = this.state.type

      // We already have a type from props, maintain prop referential identity
      if (this.props.options.type) {
        return <Pane {...this.props} />
      }

      // We have resolved a type, use it
      if (type) {
        return <Pane {...this.props} options={{...this.props.options, type}} />
      }

      // Document did not exist
      if (type === null) {
        return (
          <ErrorPane>
            Document with ID <code>{this.props.options.id}</code> not found
          </ErrorPane>
        )
      }

      // Undecided, still loading type from server
      return <LoadingPane {...this.props} />
    }
  }
}
