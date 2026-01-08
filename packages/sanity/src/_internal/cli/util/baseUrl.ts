export const baseUrl =
  process.env.SANITY_INTERNAL_ENV === 'staging'
    ? 'https://www.sanity.work'
    : 'https://www.sanity.io'
