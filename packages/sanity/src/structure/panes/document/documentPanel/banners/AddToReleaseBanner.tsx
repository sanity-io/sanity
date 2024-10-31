import {Flex, Text} from '@sanity/ui'
import {type CSSProperties, useCallback} from 'react'
import {
  getReleaseTone,
  LATEST,
  type ReleaseDocument,
  Translate,
  useTranslation,
  useVersionOperations,
} from 'sanity'
import {structureLocaleNamespace} from 'sanity/structure'

import {Button} from '../../../../../ui-components'
import {Banner} from './Banner'

export function AddToReleaseBanner({
  documentId,
  documentType,
  currentRelease,
}: {
  documentId: string
  documentType: string
  currentRelease: ReleaseDocument
}): JSX.Element {
  const tone = getReleaseTone(currentRelease ?? LATEST)
  const {t} = useTranslation(structureLocaleNamespace)
  const {t: tCore} = useTranslation()

  const {createVersion} = useVersionOperations(documentId, documentType)

  const handleAddToRelease = useCallback(() => {
    if (currentRelease._id) {
      createVersion(currentRelease._id)
    }
  }, [createVersion, currentRelease._id])

  return (
    <Banner
      tone={tone}
      paddingY={0}
      content={
        <Flex align="center" justify="space-between" gap={1} flex={1}>
          <Text size={1} weight="medium">
            <Translate
              i18nKey="banners.release.not-in-release"
              t={t}
              values={{
                title:
                  currentRelease.metadata.title || tCore('release.placeholder-untitled-release'),
              }}
              components={{
                Label: ({children}) => {
                  return (
                    <span
                      style={
                        {
                          color: `var(--card-badge-${tone ?? 'default'}-fg-color)`,
                          backgroundColor: `var(--card-badge-${tone ?? 'default'}-bg-color)`,
                          borderRadius: 3,
                          textDecoration: 'none',
                          padding: '0px 2px',
                          fontWeight: 500,
                        } as CSSProperties
                      }
                    >
                      {children}
                    </span>
                  )
                },
              }}
            />
          </Text>

          <Button
            text={t('banners.release.action.add-to-release')}
            tone={tone}
            onClick={handleAddToRelease}
          />
        </Flex>
      }
    />
  )
}
