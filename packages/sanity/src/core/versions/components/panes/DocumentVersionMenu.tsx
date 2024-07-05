/* eslint-disable no-warning-comments */
import {ChevronDownIcon} from '@sanity/icons'
import {Box, Button} from '@sanity/ui'
import {useCallback, useContext, useEffect, useState} from 'react'
import {DEFAULT_STUDIO_CLIENT_OPTIONS, useClient} from 'sanity'

import {
  VersionContext,
  type VersionContextValue,
} from '../../../../_singletons/core/form/VersionContext'
import {useBundles} from '../../../store/bundles/BundlesProvider'
import {type BundleDocument} from '../../../store/bundles/types'
import {getAllVersionsOfDocument} from '../../util/dummyGetters'
import {BundleBadge} from '../BundleBadge'
import {BundleMenu} from '../BundleMenu'

// TODO A LOT OF DOCUMENTED CODE IS RELATED TO SEARCH AND CREATING BUNDLE FROM HERE
// STILL NEED TO DECIDE IF WE KEEP IT OR NOT
export function DocumentVersionMenu(props: {documentId: string}): JSX.Element {
  const {documentId} = props
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  // TODO MAKE SURE THIS IS HOW WE WANT TO DO THIS
  const {currentVersion, isDraft} = useContext<VersionContextValue>(VersionContext)

  const {title, hue, icon} = currentVersion

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

  /* TODO Version Badge should only show when the current opened document is in a version */

  return (
    <>
      {currentVersion && !isDraft && (
        <BundleBadge hue={hue} title={title} icon={icon} padding={2} />
      )}

      {/**
       * TODO IS THIS STILL NEEDED? VS THE PICKER IN STUDIO NAVBAR? */}
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
