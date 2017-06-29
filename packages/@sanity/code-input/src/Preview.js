import React, {PureComponent} from 'react'
import PropTypes from 'prop-types'
import AceEditor from 'react-ace'
import {get} from 'lodash'
import styles from './Preview.css'

import 'brace/mode/text'
import 'brace/mode/javascript'
import 'brace/mode/json'
import 'brace/mode/jsx'
import 'brace/mode/markdown'
import 'brace/mode/css'
import 'brace/mode/html'

import 'brace/theme/tomorrow'
import {SUPPORTED_LANGUAGES, ACE_EDITOR_PROPS, ACE_SET_OPTIONS} from './config'
import createHighlightMarkers from './createHighlightMarkers'

function getLanguageTitle(value) {
  const found = SUPPORTED_LANGUAGES.find(lang => lang.value === value)
  return found ? found.title : null
}

export default class CodePreview extends PureComponent {

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
    const {layout} = this.props
    return layout === 'block'
      ? this.renderBlockPreview()
      : this.renderDefaultPreview()
  }

  renderDefaultPreview() {
    const {value} = this.props
    return (
      <div className={styles.defaultPreviewContainer}>
        <div>{(value && value.language) ? getLanguageTitle(value.language) : 'Unknown language'}</div>
      </div>
    )
  }
  renderBlockPreview() {
    const {value, type} = this.props
    const fixedLanguage = get(type, 'options.language')
    return (
      <div className={styles.root}>
        <h3>{value && getLanguageTitle(value.language)}</h3>
        <div className={styles.aceWrapper}>
          <AceEditor
            mode={(value && value.language) || fixedLanguage || 'text'}
            theme="tomorrow"
            width="100%"
            height={null}
            maxLines="200"
            readOnly
            wrapEnabled
            showPrintMargin={false}
            highlightActiveLine={false}
            cursorStart={-1}
            value={(value && value.code) || ''}
            markers={(value && value.highlightedLines) ? createHighlightMarkers(value.highlightedLines) : null}
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
