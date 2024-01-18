export const stringToPTE = `
import {defineMigration} from 'sanity/migrate'
import {patch, at, set, unset} from 'sanity/mutations'

const targetPath = parsePath('%targetPath%')

export default defineMigration({
  name: '%migrationName%',
  type: '%type%',
  migrate: {
    string(node, path, ctx) {
      if (isEqual(path, targetPath)) {
        return set([
          {
            style: 'normal',
            _type: 'block',
            children: [
              {
                _type: 'span',
                marks: [],
                text: node,
              },
            ],
            markDefs: [],
          },
        ])
      }
    },
  },
})
`
