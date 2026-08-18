export interface MiriadRestClientOptions {
  url: string
  token: string
  spaceId: string
  log?: (msg: string) => void
}

export interface MiriadChannel {
  id: string
  name: string
  displayName: string | null
  archived: boolean
}

export interface MiriadAgent {
  name: string
  status?: string
  statusMessage?: string | null
}

type JsonObject = Record<string, unknown>

export class MiriadRestClient {
  private readonly baseUrl: string
  private readonly token: string
  private readonly spaceId: string
  private readonly log: (msg: string) => void

  constructor(opts: MiriadRestClientOptions) {
    try {
      this.baseUrl = new URL(opts.url).href.replace(/\/$/, '')
    } catch {
      throw new Error(`MIRIAD_URL is not a valid URL: ${opts.url}`)
    }

    this.token = opts.token
    this.spaceId = opts.spaceId
    this.log = opts.log ?? (() => {})
  }

  async findChannelByName(name: string): Promise<MiriadChannel | null> {
    const body = await this.request(`/spaces/${this.spaceId}/channels`)
    return parseChannels(body).find((channel) => channel.name === name) ?? null
  }

  async ensureChannel(name: string): Promise<MiriadChannel> {
    const existing = await this.findChannelByName(name)
    if (existing) {
      this.log(`channel ${name} already exists - reusing`)
      return existing
    }

    this.log(`creating channel ${name}`)
    try {
      const body = await this.request(`/spaces/${this.spaceId}/channels`, {
        method: 'POST',
        body: JSON.stringify({name}),
      })
      return parseChannel(body)
    } catch (err) {
      // A concurrent trigger may create the channel between list and create.
      if (!isHttpStatusError(err, 409)) throw err

      const channel = await this.findChannelByName(name)
      if (!channel) throw err

      this.log(`channel ${name} was created concurrently - reusing`)
      return channel
    }
  }

  async addAgent(channelId: string, name: string): Promise<MiriadAgent | null> {
    this.log(`adding agent ${name} to channel ${channelId}`)
    try {
      const body = await this.request(`/channels/${channelId}/agents`, {
        method: 'POST',
        body: JSON.stringify({name}),
      })
      return parseAgent(body)
    } catch (err) {
      if (!isHttpStatusError(err, 409)) throw err

      this.log(`agent ${name} already assigned to channel ${channelId}`)
      return null
    }
  }

  async sendMessage(channelId: string, content: string): Promise<void> {
    this.log(`sending kickoff message to channel ${channelId}`)
    await this.request(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({content}),
    })
  }

  async archiveChannel(channelId: string): Promise<MiriadChannel> {
    this.log(`archiving channel ${channelId}`)
    const body = await this.request(`/channels/${channelId}/archive`, {
      method: 'POST',
    })
    return parseChannel(body)
  }

  private async request(path: string, options: RequestInit = {}): Promise<unknown> {
    const method = options.method ?? 'GET'
    this.log(`${method} ${path}`)
    const headers = new Headers(options.headers)
    headers.set('Authorization', `Bearer ${this.token}`)
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    })

    const body = await parseBody(res)
    if (!res.ok) {
      throw new HttpStatusError(method, path, res.status, body)
    }

    return body
  }
}

class HttpStatusError extends Error {
  readonly method: string
  readonly path: string
  readonly status: number
  readonly body: unknown

  constructor(method: string, path: string, status: number, body: unknown) {
    super(`${method} ${path} failed: ${status} ${formatBody(body)}`)
    this.name = 'HttpStatusError'
    this.method = method
    this.path = path
    this.status = status
    this.body = body
  }
}

function isHttpStatusError(err: unknown, status: number): err is HttpStatusError {
  return err instanceof HttpStatusError && err.status === status
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function formatBody(body: unknown): string {
  if (body === null || body === undefined) return '(empty response)'
  return typeof body === 'string' ? body : JSON.stringify(body)
}

function parseChannels(body: unknown): MiriadChannel[] {
  const rawChannels = Array.isArray(body)
    ? body
    : isObject(body) && Array.isArray(body.channels)
      ? body.channels
      : []

  return rawChannels
    .map((channel) => toChannel(channel))
    .filter((channel): channel is MiriadChannel => channel !== null)
}

function parseChannel(body: unknown): MiriadChannel {
  const channel = toChannel(body)
  if (!channel)
    throw new Error(`Miriad channel payload did not match expected shape: ${formatBody(body)}`)
  return channel
}

function parseAgent(body: unknown): MiriadAgent {
  if (!isObject(body) || typeof body.name !== 'string') {
    throw new Error(`Miriad agent payload did not match expected shape: ${formatBody(body)}`)
  }

  return {
    name: body.name,
    status: typeof body.status === 'string' ? body.status : undefined,
    statusMessage: typeof body.statusMessage === 'string' ? body.statusMessage : null,
  }
}

function toChannel(value: unknown): MiriadChannel | null {
  if (!isObject(value) || typeof value.id !== 'string' || typeof value.name !== 'string') {
    return null
  }

  return {
    id: value.id,
    name: value.name,
    displayName: typeof value.displayName === 'string' ? value.displayName : null,
    archived: typeof value.archived === 'boolean' ? value.archived : false,
  }
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null
}
