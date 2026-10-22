/* THIS FILE IS TEMPORARY - IMPORT FROM @SANITY/ICONS WHEN AVAILABLE */

import {type RefAttributes, type SVGProps} from 'react'

/**
 * The undecided release: ClockIcon's geometry and stroke weight, with the face dashed (12 even dashes) and the hands kept.
 *
 * @public
 */
export function ClockDashedIcon(props: SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>) {
  const {ref, ...rest} = props
  return (
    <svg
      data-sanity-icon="clock-dashed"
      width="1em"
      height="1em"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      {...rest}
    >
      <circle
        cx="12.5"
        cy="12.5"
        r="8"
        pathLength={24}
        stroke="currentColor"
        strokeDasharray="1.2 0.8"
        strokeWidth={1.2}
      />
      <path
        d="M12.5 8V12.5L15.5 15.5"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
  )
}
