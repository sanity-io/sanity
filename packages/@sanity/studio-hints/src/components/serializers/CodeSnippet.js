/* eslint-disable complexity */
/* eslint-disable react/no-multi-comp */
import React, {useState} from 'react'
import PropTypes from 'prop-types'
import Refractor from 'react-refractor'
import styles from './CodeSnippet.css'
import {CopyToClipboard} from 'react-copy-to-clipboard'
import js from 'refractor/lang/javascript'
import json from 'refractor/lang/json'
import jsx from 'refractor/lang/jsx'
import bash from 'refractor/lang/bash'
import css from 'refractor/lang/css'
import php from 'refractor/lang/php'
import markdown from 'refractor/lang/markdown'
import csharp from 'refractor/lang/csharp'
import groq from './groq.prism'

// Then register them
Refractor.registerLanguage(js)
Refractor.registerLanguage(json)
Refractor.registerLanguage(jsx)
Refractor.registerLanguage(php)
Refractor.registerLanguage(bash)
Refractor.registerLanguage(css)
Refractor.registerLanguage(markdown)
Refractor.registerLanguage(groq)
Refractor.registerLanguage(csharp)

function Icon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0"
      viewBox="0 0 512 512"
      className={styles.copyPasteIcon}
    >
      <path
        stroke="none"
        d="M405.333 80h-87.35C310.879 52.396 285.821 32 256 32s-54.879 20.396-61.983 48h-87.35C83.198 80 64 99.198 64 122.667v314.665C64 460.801 83.198 480 106.667 480h298.666C428.802 480 448 460.801 448 437.332V122.667C448 99.198 428.802 80 405.333 80zM256 80c11.729 0 21.333 9.599 21.333 21.333s-9.604 21.334-21.333 21.334-21.333-9.6-21.333-21.334S244.271 80 256 80zm152 360H104V120h40v72h224v-72h40v320z"
      />
    </svg>
  );
}

const CodeSnippet = props => {
  const {value} = props
  let {language} = props

  const [isCopied, setIsCopied] = useState(false)

  function handleCopy() {
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  if (!language) {
    language = 'text'
  }

  if (!value) {
    // eslint-disable-next-line no-console
    console.error('Missing code')
    return <div />
  }
  const lines = value.split('\n')
  const linesLength = lines.length
  const lastLineLength = lines && linesLength && lines[linesLength - 1] ? lines[linesLength - 1].length : value && value.length

  const longLastLine = lastLineLength > 70
  const longLastLineMobile = lastLineLength > 25

  if (language === 'text' || !Refractor.hasLanguage(language)) {
    if (language !== 'text') {
      // eslint-disable-next-line no-console
      console.warn('Syntax highlighting for `%s` not found, rendering as plain text', language)
    }

    return (
      <div className={styles.root} data-long-last-line={longLastLine} data-long-last-line-mobile={longLastLineMobile}>
        <pre className={styles.code}>{value}</pre>
        <CopyToClipboard text={props.value} onCopy={handleCopy}>
          <button className={styles.copyPasteButton} title="Copy to clipboard">
            {isCopied ? <span className={styles.copiedCheck}>✓</span> : <Icon />}
          </button>
        </CopyToClipboard>
      </div>
    )
  }

  return (
    <div className={styles.root} data-long-last-line={longLastLine} data-long-last-line-mobile={longLastLineMobile}>
      <div className={styles.code}>
        <Refractor {...props} language={language} />
      </div>
      <CopyToClipboard text={props.value} onCopy={handleCopy}>
        <button className={styles.copyPasteButton} title="Copy to clipboard">
          {isCopied ? <span className={styles.copiedCheck}>✓</span> : <Icon />}
        </button>
      </CopyToClipboard>
    </div>
  )
}

CodeSnippet.propTypes = {
  value: PropTypes.string.isRequired,
  language: PropTypes.string
}

CodeSnippet.defaultProps = {
  language: 'text',
  value: ''
}

export default CodeSnippet
