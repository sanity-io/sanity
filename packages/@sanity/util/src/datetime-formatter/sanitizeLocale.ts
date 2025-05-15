// this is used to avoid issues with the Intl.DateTimeFormat constructor as part of the efps tests
const sanitizeLocale = (locale: string): string => locale.replace(/@posix$/, '')

export default sanitizeLocale
