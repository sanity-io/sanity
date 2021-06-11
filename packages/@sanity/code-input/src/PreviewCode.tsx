import React, {PureComponent} from 'react'
import PropTypes from 'prop-types'
import AceEditor from 'react-ace'
import {get} from 'lodash'
import styles from './PreviewCode.css'

/* eslint-disable import/no-unassigned-import */
import 'brace/mode/batchfile'
import 'brace/mode/css'
import 'brace/mode/html'
import 'brace/mode/javascript'
import 'brace/mode/json'
import 'brace/mode/jsx'
import 'brace/mode/markdown'
import 'brace/mode/php'
import 'brace/mode/sass'
import 'brace/mode/scss'
import 'brace/mode/python'
import 'brace/mode/sh'
import 'brace/mode/text'
import 'brace/theme/github'
import 'brace/theme/monokai'
import 'brace/theme/terminal'
import 'brace/theme/tomorrow'
import './groq'
/* eslint-enable import/no-unassigned-import */

import {SUPPORTED_LANGUAGES, LANGUAGE_ALIASES, ACE_EDITOR_PROPS, ACE_SET_OPTIONS} from './config'
import createHighlightMarkers from './createHighlightMarkers'

function isSupportedLanguage(mode) {
  const alias = LANGUAGE_ALIASES[mode]
  if (alias) {
    return alias
  }

  const isSupported = SUPPORTED_LANGUAGES.find((lang) => lang.value === mode)
  if (isSupported) {
    return mode
  }

  return false
}

export default class PreviewCode extends PureComponent {
  static propTypes = {
    type: PropTypes.object,
    value: PropTypes.shape({
      _type: PropTypes.string,
      code: PropTypes.string,
      language: PropTypes.string,
      highlightedLines: PropTypes.array,
    }),
  }

  ace = React.createRef()

  componentDidMount() {
    // Avoid cursor and focus tracking by Ace
    const ace = this.ace && this.ace.current
    if (ace) {
      ace.editor.renderer.$cursorLayer.element.style.opacity = 0
      ace.editor.textInput.getElement().disabled = true
    }
  }

  render() {
    const {value, type} = this.props
    const fixedLanguage = get(type, 'options.language')
    const mode = isSupportedLanguage((value && value.language) || fixedLanguage) || 'text'
    return (
      <div className={styles.root}>
        <div className={styles.aceWrapper}>
          <AceEditor
            ref={this.ace}
            focus={false}
            mode={mode}
            theme="monokai"
            width="100%"
            onChange={() => undefined}
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
