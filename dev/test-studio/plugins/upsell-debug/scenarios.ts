export type UpsellScenario = 'releases-quota-reached' | 'releases-feature-disabled'

export const UPSELL_SCENARIO_BASE_PATHS: Record<UpsellScenario, string> = {
  'releases-quota-reached': '/releases-quota-reached',
  'releases-feature-disabled': '/releases-feature-disabled',
}

interface ReleaseLimitsBody {
  data?: {orgMeteredActiveReleaseCount: number; orgActiveReleaseLimit: number | null}
}

interface ResponseOverride {
  requestPath: RegExp
  override: (response: Response) => Promise<Response>
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {status, headers: {'content-type': 'application/json'}})
}

async function withoutContentReleases(response: Response): Promise<Response> {
  const features: string[] = await response.clone().json()
  return jsonResponse(
    features.filter((feature) => feature !== 'contentReleases'),
    response.status,
  )
}

async function atOrgReleaseQuota(response: Response): Promise<Response> {
  const {data}: ReleaseLimitsBody = await response.clone().json()
  if (data === undefined) return response

  const quota = Math.max(data.orgMeteredActiveReleaseCount, 1)
  return jsonResponse(
    {data: {...data, orgActiveReleaseLimit: quota, orgMeteredActiveReleaseCount: quota}},
    200,
  )
}

const OVERRIDES: Record<UpsellScenario, ResponseOverride> = {
  'releases-feature-disabled': {
    requestPath: /\/v[^/]+\/features$/,
    override: withoutContentReleases,
  },
  'releases-quota-reached': {
    requestPath: /\/projects\/[^/]+\/new-content-release-allowed$/,
    override: atOrgReleaseQuota,
  },
}

const SCENARIOS: UpsellScenario[] = ['releases-quota-reached', 'releases-feature-disabled']

export function scenarioForPath(pathname: string): UpsellScenario | undefined {
  return SCENARIOS.find((scenario) => {
    const basePath = UPSELL_SCENARIO_BASE_PATHS[scenario]
    return pathname === basePath || pathname.startsWith(`${basePath}/`)
  })
}

function requestPath(input: RequestInfo | URL): string {
  const url = input instanceof Request ? input.url : String(input)
  return new URL(url, window.location.origin).pathname
}

async function overrideForScenario(
  input: RequestInfo | URL,
  response: Response,
): Promise<Response> {
  const scenario = scenarioForPath(window.location.pathname)
  const scenarioOverride = scenario ? OVERRIDES[scenario] : undefined
  if (scenarioOverride?.requestPath.test(requestPath(input)) && response.ok) {
    return scenarioOverride.override(response)
  }
  return response
}

// The studio caches these answers for the session, so entering or leaving a scenario needs a reload
export const scenarioAtLoad =
  typeof window === 'object' ? scenarioForPath(window.location.pathname) : undefined

export function installUpsellScenarioFetch(): void {
  const originalFetch = window.fetch.bind(window)
  window.fetch = async (input, init) => overrideForScenario(input, await originalFetch(input, init))
}
