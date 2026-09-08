// strips the `@posix` suffix some environments append to locales, which the Intl.DateTimeFormat constructor rejects
const sanitizeLocale = (locale: string): string => locale.replace(/@posix$/, '')

export default sanitizeLocale
