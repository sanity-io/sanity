/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/forbid-prop-types */
/* eslint-disable react/jsx-filename-extension */

import React from 'react'
import PropTypes from 'prop-types'
import FormBuilder from 'part:@sanity/form-builder'
import styles from '../Editor.css'

const noop = () => null
const noopPatchChannel = {onPatch: () => noop, receivePatches: noop}

export default class HistoryForm extends React.PureComponent {
  static propTypes = {
    schema: PropTypes.object.isRequired,
    schemaType: PropTypes.shape({name: PropTypes.string}).isRequired,
    document: PropTypes.shape({_type: PropTypes.string})
  }

  static defaultProps = {
    document: undefined
  }

  state = {
    focusPath: []
  }

  handleFocus = focusPath => {
    this.setState({focusPath})
  }

  // eslint-disable-next-line complexity
  render() {
    const {schema, schemaType, document} = this.props
    const {focusPath} = this.state

    return (
      <form className={styles.editor} id="Sanity_Default_DeskTool_Editor_ScrollContainer">
        {document ? (
          <FormBuilder
            onBlur={noop}
            onFocus={this.handleFocus}
            focusPath={focusPath}
            readOnly
            schema={schema}
            type={schemaType}
            value={document}
            patchChannel={noopPatchChannel}
          />
        ) : (
          <p>There is no data associated with this history event.</p>
        )}
      </form>
    )
  }
}
