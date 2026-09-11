import {Text} from '@sanity/ui'
import {useCallback} from 'react'
import {
  getTargetSiblings,
  usePerspective,
  useSetPerspective,
  useTranslation,
  useWorkspace,
} from 'sanity'

import {usePaneRouter} from '../../../../components/paneRouter/usePaneRouter'
import {structureLocaleNamespace} from '../../../../i18n'
import {shouldShowSeeDraftBanner} from '../../../../shouldShowSeeDraftBanner'
import {useDocumentPane} from '../../useDocumentPane'
import {Banner} from './Banner'

export function SeeDraftBanner() {
  const {t} = useTranslation(structureLocaleNamespace)
  const {schemaType, targetDocumentState} = useDocumentPane()
  const {selectedPerspective} = usePerspective()
  const setPerspective = useSetPerspective()
  const workspace = useWorkspace()
  const {params} = usePaneRouter()
  const siblings = getTargetSiblings(targetDocumentState)

  const handleSeeDraft = useCallback(() => {
    setPerspective('drafts')
  }, [setPerspective])

  if (
    !shouldShowSeeDraftBanner({
      selectedPerspective,
      schemaType,
      workspace,
      siblings,
      isHistoryRevision: Boolean(params?.rev),
    })
  ) {
    return null
  }

  return (
    <Banner
      tone="suggest"
      data-testid="see-draft-banner"
      content={<Text size={1}>{t('banners.published.see-draft.text')}</Text>}
      action={{
        text: t('banners.published.see-draft.action'),
        tone: 'suggest',
        onClick: handleSeeDraft,
        mode: 'default',
      }}
    />
  )
}
