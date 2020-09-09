import Chance from 'chance'
import {range, random} from 'lodash'
import {List as GridList, Item as GridItem} from 'part:@sanity/components/lists/grid'
import MediaPreview from 'part:@sanity/components/previews/media'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import React from 'react'

const chance = new Chance()

export function MediaPreviewStory() {
  const items = range(50).map((_, i) => {
    const width = random(10, 80) * 10
    const height = random(10, 50) * 10
    const randomImage = `http://placekitten.com/${width}/${height}`
    return {
      key: `${i}`,
      title: chance.name(),
      imageUrl: randomImage,
      aspect: width / height
    }
  })
  return (
    <Sanity part="part:@sanity/components/lists/grid" propTables={[GridList]}>
      <GridList>
        {items.map(item => (
          <GridItem key={item.key}>
            <MediaPreview {...item} />
          </GridItem>
        ))}
      </GridList>
    </Sanity>
  )
}
