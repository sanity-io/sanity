/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

export function DraftStatusBadge(props: any) {
  return props.draft
    ? {
        label: 'Draft',
        color: 'warning'
      }
    : null
}
