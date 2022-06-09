// eslint-disable-next-line no-process-env
export const isDev = process.env.NODE_ENV !== 'production'
export const isProd = !isDev
