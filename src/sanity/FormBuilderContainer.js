import React, {PropTypes} from 'react'
import equals from 'shallow-equals'
import SanityFormBuilder from './SanityFormBuilder'
import QueryContainer from 'component:@sanity/base/query-container'

function mapToFormbuilderProps({result, ...rest}) {
  return {
    initialValue: result && result.documents && result.documents[0],
    ...rest
  }
}

class FormBuilderContainer extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    return !equals(this.props, nextProps) || !equals(this.state, nextState)
  }
  render() {
    const {documentId} = this.props
    return (
      <QueryContainer query="*[.$id == %id]" params={{id: documentId}} mapFn={mapToFormbuilderProps}>
        <SanityFormBuilder documentId={documentId} typeName={this.props.typeName} />
      </QueryContainer>
    )
  }
}

FormBuilderContainer.propTypes = {
  documentId: PropTypes.string,
  typeName: PropTypes.string
}

export default FormBuilderContainer
