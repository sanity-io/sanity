/**
 * Curly braces, the pretty-print icon of browser devtools, drawn on the 25×25 grid and 1.2 stroke
 * of `@sanity/icons` so it sits next to them like one of their own
 */
export function PrettifyIcon() {
  return (
    <svg
      data-sanity-icon="prettify"
      fill="none"
      height="1em"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.2}
      viewBox="0 0 25 25"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M10.5 5.5H10C8.9 5.5 8 6.4 8 7.5V10.5C8 11.6 7.1 12.5 6 12.5C7.1 12.5 8 13.4 8 14.5V17.5C8 18.6 8.9 19.5 10 19.5H10.5" />
      <path d="M14.5 5.5H15C16.1 5.5 17 6.4 17 7.5V10.5C17 11.6 17.9 12.5 19 12.5C17.9 12.5 17 13.4 17 14.5V17.5C17 18.6 16.1 19.5 15 19.5H14.5" />
    </svg>
  )
}
