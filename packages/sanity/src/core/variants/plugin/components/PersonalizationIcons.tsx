import {forwardRef, type ForwardRefExoticComponent, type RefAttributes, type SVGProps} from 'react'

export const RhombusIcon: ForwardRefExoticComponent<
  Omit<SVGProps<SVGSVGElement>, 'ref'> & RefAttributes<SVGSVGElement>
> = forwardRef(function RhombusIcon(props, ref) {
  return (
    <svg
      data-sanity-icon="rhombus"
      width="1em"
      height="1em"
      viewBox="0 0 21 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      ref={ref}
    >
      <path
        d="M10.5 3.78L17.22 10.5L10.5 17.22L3.78 10.5L10.5 3.78Z"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
  )
})
