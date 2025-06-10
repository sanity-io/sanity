// Text displayed in toasts on any 403 Forbidden request
// (usually if a project doesn't have access to the Scheduled Publishing feature)
export const FORBIDDEN_RESPONSE_TEXT =
  'Forbidden. Please check that your project has access to Scheduled Publishing.'

// date-fns compatible date formats
// https://date-fns.org/v2.28.0/docs/format
export const DATE_FORMAT = {
  // 1 Oct 22, 10:00 PM
  SMALL: `d MMM yy',' p`,
  // 1 October 2022, 10:00 PM
  MEDIUM: `d MMMM yyyy',' p`,
  // Saturday, 1 October 2022, 10:00 PM
  LARGE: `iiii',' d MMMM yyyy',' p`,
}
