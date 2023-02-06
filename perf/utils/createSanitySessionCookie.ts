export function createSanitySessionCookie(projectId: string, token: string) {
  return {
    name: 'sanitySession',
    value: token,
    sameSite: 'None' as const,
    secure: true,
    httpOnly: true,
    domain: `.${projectId}.api.sanity.io`,
    path: '/',
  }
}
