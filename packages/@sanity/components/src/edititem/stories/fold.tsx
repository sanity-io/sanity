import Chance from 'chance'
import EditItemFold from 'part:@sanity/components/edititem/fold'
import {action} from 'part:@sanity/storybook/addons/actions'
import {text, number} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import React from 'react'
import {Container} from 'part:@sanity/storybook/components'

const chance = new Chance()

const wrapperStyles: React.CSSProperties = {
  width: '50%',
  margin: '0 auto',
  backgroundColor: '#ccc',
  minHeight: '50vh',
  maxHeight: '70vh',
  paddingTop: '5rem',
  position: 'relative',
  overflow: 'scroll'
}

export function FoldStory() {
  return (
    <Container>
      <div style={wrapperStyles}>
        <p>Over</p>
        <Sanity part="part:@sanity/components/edititem/fold" propTables={[EditItemFold]}>
          <EditItemFold title="Edit this item" onClose={action('onClose')}>
            {text('children (prop)', 'Put your content here')}
            <div style={{height: `${number('content padding', 10)}px`}} />
          </EditItemFold>
        </Sanity>
        <p>Under</p>
        {chance.paragraph()}
        {chance.paragraph()}
        {chance.paragraph()}
        {chance.paragraph()}
        {chance.paragraph()}
        {chance.paragraph()}
        {chance.paragraph()}
        {chance.paragraph()}
      </div>
    </Container>
  )
}
