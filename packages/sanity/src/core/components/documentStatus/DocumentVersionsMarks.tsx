import {type ReactNode} from 'react'

import {useTranslation} from '../../i18n/hooks/useTranslation'

/**
 * A row's status marks with a spoken summary of the document's versions ("3 versions"), for
 * surfaces that show the marks without the versions tooltip: search results and reference field
 * previews while the document group inventory is enabled. The inventory, reached from the
 * document, lists the versions themselves.
 *
 * @internal
 */
export function DocumentVersionsMarks(props: {children: ReactNode; versionCount: number}) {
  const {children, versionCount} = props
  const {t} = useTranslation()
  return (
    <span
      aria-label={t('document-group.marks.label', {count: versionCount})}
      data-testid="document-versions-marks"
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- an inline cluster of icons inside a preview row; a fieldset would break the row's layout
      role="group"
      style={{display: 'inline-flex', alignItems: 'center'}}
    >
      {children}
    </span>
  )
}
