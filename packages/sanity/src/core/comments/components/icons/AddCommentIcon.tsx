import React, {forwardRef} from 'react'

export const AddCommentIcon = forwardRef(function Icon(
  props: React.SVGProps<SVGSVGElement>,
  ref: React.Ref<SVGSVGElement>,
) {
  return (
    <svg
      data-sanity-icon="add-comment"
      fill="none"
      height="1em"
      ref={ref}
      viewBox="0 0 25 25"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12.3368 8.5625H6.89453C5.78996 8.5625 4.89453 9.45793 4.89453 10.5625V16.0714C4.89453 17.1759 5.78996 18.0714 6.89453 18.0714H8.69808V21.8749L12.5016 18.0714H16.207C17.3115 18.0714 18.207 17.1759 18.207 16.0714V14.2991"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <path
        d="M18.2081 4.66895V12.4562M14.3145 8.56257H22.1017"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
  )
})
