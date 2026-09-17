import {splitOnSearchTerm} from './splitOnSearchTerm'

/**
 * A label with the occurrences of the filter term marked.
 *
 * Shared by both perspective menus, and by the published and drafts rows inside the release one:
 * every row that is filtered on its label should show why it survived the filter.
 */
export function MarkedLabel({label, searchTerm}: {label: string; searchTerm: string | undefined}) {
  return (
    <>
      {splitOnSearchTerm(label, searchTerm ?? '').map((segment, index) =>
        segment.isMatch ? (
          // oxlint-disable-next-line react/no-array-index-key -- segments are derived from the label
          <strong key={index}>{segment.text}</strong>
        ) : (
          // oxlint-disable-next-line react/no-array-index-key -- segments are derived from the label
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  )
}
