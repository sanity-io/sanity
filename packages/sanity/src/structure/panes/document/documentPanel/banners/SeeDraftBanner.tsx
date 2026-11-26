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
  // With Variants off the banner keeps its earlier purple (suggest) tone
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

  if (!variantsEnabled) {
    return (
      <Banner
        tone="suggest"
        data-testid="see-draft-banner"
        content={
          <Text size={1} as="div" trim={true} tone="suggest">
            {t('banners.published.see-draft.text')}
          </Text>
        }
        action={{
          text: t('banners.published.see-draft.action'),
          tone: 'suggest',
          onClick: handleSeeDraft,
          mode: 'default',
        }}
      />
    )
  }

  return (
    // Neutral: purple (suggest) is the variants tone, and this banner is about drafts.
    <Banner
      tone="default"
      data-testid="see-draft-banner"
      content={
        <Text size={1} as="div" trim={true}>
          {t('banners.published.see-draft.text')}
        </Text>
      }
      action={{
        text: t('banners.published.see-draft.action'),
        onClick: handleSeeDraft,
        mode: 'default',
      }}
    />
  )
}
