import {Card, Text} from '@sanity/ui'
import {type SystemVariant} from 'sanity'

import {useCorpus} from '../c5/useCorpus'
import {useOption} from '../options/store'

/** Through the PROPOSED `VariantEditNoticeProvider`: the consequence line in the shipped Edit dialog (C6 option A). */
export function EditNotice({variant}: {variant: SystemVariant}) {
  const enabled = useOption('c6') === 'a'
  const corpus = useCorpus()
  if (!enabled || !corpus) return null
  const id = variant._id.replace(/^_\.variants\./, '')
  const docs = corpus.docs.filter((d) => d.variantIds.includes(id))
  const published = docs.filter((d) => d.list.some((r) => r.variantId === id && r.bundle === 'published')).length
  return (
    <Card data-testid="edit-notice" padding={3} radius={2} tone={docs.length ? 'caution' : 'transparent'}>
      <Text size={1}>
        {docs.length === 0
          ? 'No documents use this definition yet, so changing it affects nothing.'
          : `${docs.length} ${docs.length === 1 ? 'document is' : 'documents are'} affected${published ? `, ${published} of them published: changing the conditions changes who is served them.` : '.'}`}
      </Text>
    </Card>
  )
}
