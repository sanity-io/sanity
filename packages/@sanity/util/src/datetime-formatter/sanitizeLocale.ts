const sanitizeLocale = (locale: string): string => locale.replace(/@posix$/, '')

export default sanitizeLocale
