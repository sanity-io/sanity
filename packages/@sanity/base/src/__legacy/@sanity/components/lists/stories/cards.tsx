import Chance from 'chance'
import {range} from 'lodash'
import {List as GridList, Item as GridItem} from 'part:@sanity/components/lists/grid'
import CardPreview from 'part:@sanity/components/previews/card'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import React from 'react'

const chance = new Chance()

export function CardsStory() {
  const items = range(50).map((_, i) => {
    const width = 300
    const height = 120
    const randomImage = `http://placekitten.com/${width}/${height}`
    return {
      key: `${i}`,
      title: chance.name(),
      subtitle: chance.sentence(),
      description: chance.sentence({words: 1}),
      media: <img src={randomImage} height={height} width={width} />,
    }
  })

  return (
    <Sanity part="part:@sanity/components/lists/grid" propTables={[GridList]}>
      <GridList>
        {items.map((item) => (
          <GridItem key={item.key}>
            <CardPreview {...item} />
          </GridItem>
        ))}
      </GridList>
    </Sanity>
  )
}
