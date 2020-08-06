declare module 'part:*'
declare module 'all:part:*'
declare module 'part:@sanity/base/client' {
  const client: import('@sanity/client').SanityClient
  export default client
}
