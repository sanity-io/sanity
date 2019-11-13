import React from 'react'
import PropTypes from 'prop-types'
import BlockContent from '@sanity/block-content-to-react'
import ArrowRight from 'part:@sanity/base/arrow-right'
import styles from './HintPage.css'
import Image from './serializers/Image'
import CodeSnippet from './serializers/CodeSnippet'

const serializers = {
  types: {
    image: props => {
      return <Image {...props} />
    },
    code: ({node}) => {
      const {code, language, _key, highlightedLines} = node

      if (!code) {
        console.error('empty code block') // eslint-disable-line no-console
        return <div />
      }
      return (
        <div>
          <CodeSnippet
            key={_key}
            language={language == 'sh' ? 'bash' : language}
            value={code}
            markers={highlightedLines || []}
          />
        </div>
      )
    }
  }
}

function HintPage(props) {
  const {hint, onBackClick} = props
  return (
    <div className={styles.root}>
      <button className={styles.backButton} onClick={() => onBackClick(null)}>
        <ArrowRight /> Back
      </button>
      <div className={styles.blockContent}>
        <h2 className={styles.blockHeading}>{hint.title}</h2>
        <BlockContent blocks={hint.body} serializers={serializers} />
      </div>
    </div>
  )
}

HintPage.propTypes = {
  hint: PropTypes.object.isRequired,
  onBackClick: PropTypes.func.isRequired
}

export default HintPage
