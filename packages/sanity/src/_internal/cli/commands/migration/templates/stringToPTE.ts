export const stringToPTE = `
import {defineNodeMigration} from '@sanity/migrate'
import {patch, at, set, unset} from '@sanity/migrate/mutations'

const targetPath = parsePath('%targetPath%')

export default defineNodeMigration({
  name: '%migrationName%',
  type: '%type%',
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
})
`
