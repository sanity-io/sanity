/* eslint-disable react/no-multi-comp */
import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import EditItemFold from 'part:@sanity/components/edititem/fold'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import Chance from 'chance'
import {withKnobs, text, number} from 'part:@sanity/storybook/addons/knobs'
const chance = new Chance()

storiesOf('Edit item')
  .addDecorator(withKnobs)
  .add('Fold', () => {
    const wrapperStyles = {
      width: '50%',
      margin: '0 auto',
      backgroundColor: '#ccc',
      minHeight: '50vh',
      maxHeight: '70vh',
      paddingTop: '5rem',
      position: 'relative',
      overflow: 'scroll'
    }
    return (
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
    )
  })
