/* eslint-disable id-length */

import {Summarizers, Summary} from './bateson'

// If the differ takes responsibility for the change in question
// --> return an array of summaries, empty array means no summary needed
// --> return null to "drop the ball" and rely on a default summary to be created

function extractText(blockContent): string {
  return blockContent.children
    .map(item => (item._type == 'span' ? item.text : null))
    .filter(Boolean)
    .join('')
}

const summarizers: Summarizers = {
  block: {
    resolve: (a, b, _): Summary => {
      const aText = extractText(a)
      const bText = extractText(b)

      if (aText !== bText) {
        return {
          fields: [],
          changes: [
            {
              operation: 'editText',
              // type: 'block',
              from: aText,
              to: bText
            }
          ]
        }
      }
      return {
        fields: [],
        changes: []
      }
    }
  },

  string: {
    resolve: (a, b, _): Summary => {
      return {
        fields: [],
        changes: [
          {
            operation: 'editText',
            from: a,
            to: b
          }
        ]
      }
    }
  },

  image: {
    resolve: (a, b, _): Summary => {
      const changes = []
      if (!a.asset && b.asset) {
        changes.push({operation: 'addImage', to: b.asset._ref})
      } else if (a.asset && !b.asset) {
        changes.push({operation: 'removeImage', from: a.asset._ref})
      } else if (a.asset && b.asset && a.asset._ref !== b.asset._ref) {
        changes.push({operation: 'replaceImage', from: a.asset._ref, to: b.asset._ref})
      }
      return changes.length ? {fields: ['asset'], changes} : null
    }
  }
}

export default summarizers
