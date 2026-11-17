import {defineType, type DocumentVersionKind} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {createSourceFromConfig} from '../../../../config/resolveConfig'
import {useSchedulePublishAction} from '../SchedulePublishAction'

async function resolveDraftActions(versions: DocumentVersionKind[] | undefined) {
  const source = await createSourceFromConfig({
    projectId: 'ppsg7ml5',
    dataset: 'production',
    scheduledDrafts: {enabled: true},
    scheduledPublishing: {enabled: true},
    // The scheduled publishing plugin, with its own schedule action, only loads next to other plugins.
    plugins: [{name: 'test-plugin'}],
    schema: {
      types: [
        defineType({
          name: 'article',
          type: 'document',
          versions,
          fields: [{name: 'title', type: 'string'}],
        }),
      ],
    },
  })

  return source.document.actions({
    schemaType: 'article',
    documentId: 'drafts.article-1',
    versionType: 'draft',
    releaseId: undefined,
  })
}

describe('single doc release document actions', () => {
  test.each<[DocumentVersionKind[] | undefined]>([[undefined], [['scheduled-drafts']]])(
    'adds "Schedule publish" to drafts when `versions` is %j',
    async (versions) => {
      expect(await resolveDraftActions(versions)).toContain(useSchedulePublishAction)
    },
  )

  test.each<[DocumentVersionKind[]]>([[['releases', 'variants']], [[]]])(
    'leaves out every schedule action when `versions` is %j',
    async (versions) => {
      const actions = await resolveDraftActions(versions)
      expect(actions).not.toContain(useSchedulePublishAction)
      expect(actions.filter(({action}) => action === 'schedule')).toEqual([])
    },
  )
})
