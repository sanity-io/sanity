// TODO: Get this file from @sanity/icons

import {forwardRef} from 'react'

/**
 * @public
 */
export const EmptyIcon = forwardRef(function EmptyIcon(
  props: React.SVGProps<SVGSVGElement>,
  ref: React.Ref<SVGSVGElement>,
) {
  return (
    <svg
      data-sanity-icon="empty"
      width="1em"
      height="1em"
      viewBox="0 0 22 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      {...props}
    >
      <g id="icon">
        <path
          id="stroke"
          d="M11 17.5V15.9444M7.5 16.5623L8.27778 15.2151M4.93782 14.0001L6.28498 13.2223M4 10.5H5.55556M4.93777 6.99992L6.28493 7.77771M7.50003 4.4378L8.27781 5.78496M11 5.05557V3.5M13.7222 5.785L14.5 4.43784M15.715 7.77782L17.0622 7.00003M16.4444 10.5001H18M15.715 13.2223L17.0622 14.0001M13.7222 15.2152L14.5 16.5623"
          stroke="currentColor"
          strokeWidth={1.2}
        />
      </g>
    </svg>
  )
})
