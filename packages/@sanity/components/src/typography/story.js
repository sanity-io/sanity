import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'

import headings from 'part:@sanity/base/theme/typography/headings-style'
import textBlocks from 'part:@sanity/base/theme/typography/text-blocks-style'
import Hotkeys from './Hotkeys'

import Chance from 'chance'
import styles from './styles/story.css'
const chance = new Chance()

const centerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
  position: 'absolute',
  top: 0,
  left: 0
}

storiesOf('Typography')
  .add(
    'Basic',
    () => {
      return (
        <article className={styles.wrapper}>
          <h1 className={headings.heading1}>Heading 1</h1>
          <p className={textBlocks.lead}>{chance.paragraph({sentences: 5})}</p>
          <p className={textBlocks.paragraph}>{chance.paragraph({sentences: 5})}</p>
          <h2 className={headings.heading2}>Heading 2</h2>
          <p className={textBlocks.paragraph}>{chance.paragraph({sentences: 5})}</p>
          <p className={textBlocks.paragraph}>{chance.paragraph({sentences: 5})}</p>

          <h3 className={headings.heading3}>Heading 3</h3>
          <p className={textBlocks.paragraph}>{chance.paragraph({sentences: 5})}</p>
          <p className={textBlocks.paragraph}>{chance.paragraph({sentences: 5})}</p>

          <h4 className={headings.heading4}>Heading 4</h4>
          <p className={textBlocks.paragraph}>{chance.paragraph({sentences: 5})}</p>
          <p className={textBlocks.paragraph}>{chance.paragraph({sentences: 5})}</p>

          <h5 className={headings.heading5}>Heading 5</h5>
          <p className={textBlocks.paragraph}>{chance.paragraph({sentences: 5})}</p>

          <h5 className={headings.heading6}>Heading 6</h5>
          <p className={textBlocks.paragraph}>{chance.paragraph({sentences: 5})}</p>

          <h5 className={headings.heading5}>Block Quote</h5>
          <blockquote className={textBlocks.blockquote}>
            <p>{chance.paragraph({sentences: 3})}</p>
          </blockquote>
        </article>
      )
    },
    {inline: false}
  )
  .add('Hotkeys', () => {
    return (
      <div style={centerStyle}>
        <Hotkeys keys={['Ctrl', 'Alt', 'T']} />
      </div>
    )
  })
