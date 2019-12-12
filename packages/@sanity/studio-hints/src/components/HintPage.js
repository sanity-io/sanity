/* eslint-disable react/no-multi-comp, react/prop-types, react/display-name, no-console */
import React from 'react'
import PropTypes from 'prop-types'
import BlockContent from '@sanity/block-content-to-react'
import ArrowRight from 'part:@sanity/base/arrow-right'
import dynamic from 'next/dynamic'
import styles from './HintPage.css'
import internalLinkSerializer from './serializers/internalLinkSerializer'
import HintCard from './HintCard'

const YouTube = dynamic(() => import('./serializers/Video'))
const Image = dynamic(() => import('./serializers/Image'))
const CodeSnippet = dynamic(() => import('./serializers/CodeSnippet'))

/**
 * This component isn't currently used,
 * but is saved for future iteration of the Studio Hints
 * Component probably needs more work.
 */

const serializers = {
  marks: {
    internalLink: internalLinkSerializer,
    link: ({mark, children}) => (
      <a href={mark.href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  },
  types: {
    youtube: ({node: {url}}) => {
      return (
        <div className={styles.youtubeContainer}>
          <YouTube url={url} containerClassName={styles.youtube} className={styles.youtubeIframe} />
        </div>
      )
    },
    image: props => {
      return <Image {...props} />
    },
    code: ({node}) => {
      const {code, language, _key, highlightedLines} = node

      if (!code) {
        console.error('empty code block')
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
  const {hint, onBackClick, nextHint, onCardClick} = props

  return (
    <div className={styles.root}>
      <button className={styles.backButton} onClick={() => onBackClick(null)} type="button">
        <div className={styles.inner} tabIndex={-1}>
          {' '}
          <ArrowRight /> Back
        </div>
      </button>
      <div className={styles.blockContent}>
        <h2 className={styles.blockHeading}>{hint.title}</h2>
        <BlockContent blocks={hint.body || []} serializers={serializers} />
        {/* {nextHint && (
          <div style={{marginTop: '3em'}}>
            <h2 className={styles.nextHeading}>Next</h2>
            <HintCard card={nextHint} onCardClick={onCardClick} />
          </div>
        )} */}
      </div>
    </div>
  )
}

HintPage.propTypes = {
  hint: PropTypes.object.isRequired,
  nextHint: PropTypes.object.isRequired,
  onBackClick: PropTypes.func.isRequired,
  onCardClick: PropTypes.func.isRequired
}

export default HintPage
