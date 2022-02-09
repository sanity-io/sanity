import {useBoolean} from '@sanity/ui-workshop'
import React from 'react'
import {ChangelogDialog, UpgradeAccordion} from '..'
import {CHANGELOG_MOCK_DATA} from './_mock/mockData'

export default function ChangelogDialogStory() {
  const withUpgradeAccordion = useBoolean('Show upgrade accordion', true)

  const {changelog, currentVersion, latestVersion} = CHANGELOG_MOCK_DATA as any

  return (
    <ChangelogDialog
      changelog={changelog}
      currentVersion={currentVersion}
      latestVersion={latestVersion}
      dialogProps={{
        onClose: () => null,
        footer: withUpgradeAccordion && <UpgradeAccordion />,
      }}
    />
  )
}
