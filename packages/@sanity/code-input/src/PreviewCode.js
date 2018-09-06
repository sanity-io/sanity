import React, {PureComponent} from 'react'
import PropTypes from 'prop-types'
import AceEditor from 'react-ace'
import {get} from 'lodash'
import styles from './Preview.css'

/* eslint-disable import/no-unassigned-import */
import 'brace/mode/batchfile'
import 'brace/mode/css'
import 'brace/mode/html'
import 'brace/mode/javascript'
import 'brace/mode/json'
import 'brace/mode/jsx'
import 'brace/mode/markdown'
import 'brace/mode/php'
import 'brace/mode/sh'
import 'brace/mode/text'
import 'brace/theme/github'
import 'brace/theme/monokai'
import 'brace/theme/terminal'
import 'brace/theme/tomorrow'
/* eslint-enable import/no-unassigned-import */

import {SUPPORTED_LANGUAGES, ACE_EDITOR_PROPS, ACE_SET_OPTIONS} from './config'
import createHighlightMarkers from './createHighlightMarkers'

export default class PreviewCode extends PureComponent {
  static propTypes = {
    type: PropTypes.object,
    layout: PropTypes.string,
    value: PropTypes.shape({
      _type: PropTypes.string,
      code: PropTypes.string,
      language: PropTypes.string,
      highlightedLines: PropTypes.array
    })
  }

  render() {
    const {value, type} = this.props
    const fixedLanguage = get(type, 'options.language')
    return (
      <div className={styles.root}>
        <div className={styles.aceWrapper}>
          <AceEditor
            mode={(value && value.language) || fixedLanguage || 'text'}
            theme="monokai"
            width="100%"
            height={null}
            maxLines={200}
            readOnly
            wrapEnabled
            showPrintMargin={false}
            highlightActiveLine={false}
            cursorStart={-1}
            value={(value && value.code) || ''}
            markers={
              value && value.highlightedLines
                ? createHighlightMarkers(value.highlightedLines)
                : null
            }
            onLoad={this.handleEditorLoad}
            tabSize={2}
            showGutter={false}
            setOptions={ACE_SET_OPTIONS}
            editorProps={ACE_EDITOR_PROPS}
          />
        </div>
      </div>
    )
  }
}
