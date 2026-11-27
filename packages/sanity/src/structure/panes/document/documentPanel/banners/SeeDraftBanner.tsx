import {useCallback} from 'react'
import {
  getTargetSiblings,
  usePerspective,
  useSetPerspective,
  useTranslation,
  useWorkspace,
} from 'sanity'
import {Text} from 'ui5'

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
  const variantsEnabled = Boolean(workspace.beta?.variants?.enabled)
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

  // Variants on: neutral grey, since purple (suggest) is the variants tone and this banner is about
  // drafts. Variants off: purple, as before.
  const tone = variantsEnabled ? 'neutral' : 'suggest'

  return (
    <Banner
      tone={tone}
      data-testid="see-draft-banner"
      content={
        <Text size={1} as="div" trim={true} tone={variantsEnabled ? undefined : 'suggest'}>
          {t('banners.published.see-draft.text')}
        </Text>
      }
      action={{
        text: t('banners.published.see-draft.action'),
        tone: variantsEnabled ? undefined : 'suggest',
        onClick: handleSeeDraft,
        mode: 'default',
      }}
    />
  )
}
