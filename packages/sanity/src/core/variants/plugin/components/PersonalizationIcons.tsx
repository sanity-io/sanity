import {
  type ComponentType,
  forwardRef,
  type ForwardRefExoticComponent,
  type RefAttributes,
  type SVGProps,
} from 'react'

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

export const CreateVariantIcon: ComponentType = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 21 21"
    fill="none"
    {...props}
  >
    <path
      d="M17.22 10.5L10.5 3.78003L3.78003 10.5L10.5 17.22"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinejoin="round"
    />
    <path
      d="M16.7999 13.86H13.8599M13.8599 13.86H10.9199M13.8599 13.86V10.92M13.8599 13.86V16.8"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
)
