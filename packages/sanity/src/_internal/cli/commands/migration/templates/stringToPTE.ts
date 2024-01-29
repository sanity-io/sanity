export const stringToPTE = ({
  migrationName,
  documentTypes,
}: {
  migrationName: string
  documentTypes: string[]
}) => `import {pathsAreEqual, stringToPath} from 'sanity'
import {defineMigration, set} from 'sanity/migrate'

const targetPath = stringToPath('some.path')

export default defineMigration({
  title: '${migrationName}',
${
  documentTypes.length > 0
    ? `  documentTypes: [${documentTypes.map((t) => JSON.stringify(t)).join(', ')}],\n`
    : ''
}
  migrate: {
    string(node, path, ctx) {
      if (pathsAreEqual(path, targetPath)) {
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
