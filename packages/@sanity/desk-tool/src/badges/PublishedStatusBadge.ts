/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

export function PublishedStatusBadge(props: any) {
  return props.published
    ? {
        label: 'Published',
        color: 'success'
      }
    : null
}
