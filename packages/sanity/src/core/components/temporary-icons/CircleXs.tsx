/* THIS FILE IS TEMPORARY - IMPORT FROM @SANITY/ICONS WHEN AVAILABLE */

import {type RefAttributes, type SVGProps} from 'react'

/**
 * @public
 */
export function CircleXsIcon(props: SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>) {
  const {ref, ...rest} = props
  return (
    <svg
      data-sanity-icon="circle-xs"
      width="1em"
      height="1em"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      {...rest}
    >
      <circle cx={12.5} cy={12.5} r={2.5} fill="currentColor" />
    </svg>
  )
}
