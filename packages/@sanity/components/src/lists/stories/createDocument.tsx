import Chance from 'chance'
import {range} from 'lodash'
import FileIcon from 'part:@sanity/base/file-icon'
import {number} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import CreateDocumentList from 'part:@sanity/components/lists/create-document'
import React from 'react'

const chance = new Chance()

export function CreateDocumentStory() {
  const templateChoices = range(number('# Choices', 5, 'test')).map((_, i) => {
    return {
      id: `${i}`,
      key: `${i}`,
      title: chance.animal(),
      subtitle: 'test',
      template: 'test',
      icon: FileIcon
    }
  })

  return (
    <Sanity part="part:@sanity/components/lists/create-document" propTables={[CreateDocumentList]}>
      <CreateDocumentList items={templateChoices} />
    </Sanity>
  )
}
