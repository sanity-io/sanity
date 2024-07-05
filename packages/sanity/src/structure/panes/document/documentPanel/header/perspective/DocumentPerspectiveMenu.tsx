import {ChevronDownIcon} from '@sanity/icons'
import {Box, Button} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {DEFAULT_STUDIO_CLIENT_OPTIONS, useClient} from 'sanity'

import {BundleBadge} from '../../../../../../core/bundles/components/BundleBadge'
import {BundleMenu} from '../../../../../../core/bundles/components/BundleMenu'
import {usePerspective} from '../../../../../../core/bundles/hooks/usePerspective'
import {LATEST} from '../../../../../../core/bundles/util/const'
import {getAllVersionsOfDocument} from '../../../../../../core/bundles/util/dummyGetters'
import {useBundles} from '../../../../../../core/store/bundles/BundlesProvider'
import {type BundleDocument} from '../../../../../../core/store/bundles/types'

export function DocumentPerspectiveMenu(props: {documentId: string}): JSX.Element {
  const {documentId} = props
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const {currentGlobalBundle} = usePerspective()

  const {title, hue, icon} = currentGlobalBundle

  const {data: bundles} = useBundles()

  // TODO MAKE SURE THIS IS HOW WE WANT TO DO THIS
  const [documentVersions, setDocumentVersions] = useState<BundleDocument[]>([])

  const fetchVersions = useCallback(async () => {
    const response = await getAllVersionsOfDocument(bundles, client, documentId)
    setDocumentVersions(response)
  }, [bundles, client, documentId])

  // DUMMY FETCH -- NEEDS TO BE REPLACED -- USING GROQ from utils
  useEffect(() => {
    const fetchVersionsInner = async () => {
      fetchVersions()
    }

    fetchVersionsInner()
  }, [fetchVersions])

  return (
    <>
      {/* FIXME Version Badge should only show when the current opened document is in a version, RIGHT
      NOW IT'S USING THE GLOBAL */}
      {currentGlobalBundle && currentGlobalBundle.name === LATEST.name && (
        <BundleBadge hue={hue} title={title} icon={icon} padding={2} />
      )}
      {/** TODO IS THIS STILL NEEDED? VS THE PICKER IN STUDIO NAVBAR? */}
      <Box flex="none">
        <BundleMenu
          button={<Button icon={ChevronDownIcon} mode="bleed" padding={2} space={2} />}
          bundles={documentVersions}
          loading={!documentVersions}
        />
      </Box>
    </>
  )
}
