// Connects the FormBuilder with various sanity roles
import React, {PropTypes} from 'react'
import styles from './styles/EditorPane.css'
import Editor from './Editor'
import {WithFormBuilderValue} from 'part:@sanity/form-builder'

export default class EditorPane extends React.PureComponent {
  static propTypes = {
    documentId: PropTypes.string,
    typeName: PropTypes.string
  };

  render() {
    const {typeName, documentId} = this.props
    return (
      <div className={styles.root}>
        <WithFormBuilderValue typeName={typeName} documentId={documentId}>
          {Editor}
        </WithFormBuilderValue>
      </div>
    )
  }
}
