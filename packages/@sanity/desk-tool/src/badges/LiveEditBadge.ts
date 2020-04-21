/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

export function LiveEditBadge(props: any) {
  return props.liveEdit
    ? {
        label: 'Live',
        color: 'danger'
      }
    : null
}
