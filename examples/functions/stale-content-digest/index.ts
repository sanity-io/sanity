import {createClient} from '@sanity/client'
import {scheduledEventHandler} from '@sanity/functions'
import {WebClient} from '@slack/web-api'
import {env} from 'node:process'

interface Movie {
  _id: string
  title?: string
  _updatedAt: string
  overview?: string
}

interface Finding {
  title: string
  issue: string
  priority: 'high' | 'medium' | 'low'
}

interface Analysis {
  findings: Finding[]
}

const {
  SLACK_OAUTH_TOKEN = '',
  SLACK_CHANNEL = '',
  DAYS_SINCE = '180',
  STUDIO_URL = '',
  NOTIFY_WHEN_EMPTY = 'false',
  PROJECT_ID = '',
  DATASET = 'production',
  SANITY_AUTH_TOKEN = '',
} = env

// vX is required while Agent Actions are in the experimental channel.
const API_VERSION = 'vX'

const STALE_QUERY = `*[_type == "movie" && dateTime(_updatedAt) < dateTime(now()) - 60*60*24*$daysSince]{
  _id,
  title,
  _updatedAt,
  "overview": pt::text(overview)
}`

export const handler = scheduledEventHandler(async ({context}) => {
  console.log(`stale-content-digest invoked at ${new Date().toISOString()}`)

  // Scheduled handlers don't get projectId/dataset from `context.clientOptions` the
  // way document handlers do — only the token. Read project/dataset from env (passed
  // through the blueprint's function `env`) and pull the token from context.
  const client = createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: API_VERSION,
    useCdn: false,
    token: context.clientOptions?.token ?? SANITY_AUTH_TOKEN,
  })

  const daysSince = Number(DAYS_SINCE)
  const stale = await client.fetch<Movie[]>(STALE_QUERY, {daysSince})

  console.log(`Found ${stale.length} stale movies (older than ${daysSince} days)`)

  if (stale.length === 0) {
    if (NOTIFY_WHEN_EMPTY !== 'true') {
      console.log('Nothing stale this week. Skipping Slack post.')
      return
    }
    await postToSlack(
      `*No stale movies this week.* All overviews updated within the last ${daysSince} days.`,
    )
    return
  }

  // The Content Agent reviews the overviews and returns structured findings.
  // Swap this prompt to match your own content type and editorial voice.
  const analysis = (await client.agent.action.prompt({
    instruction: `You are a snarky movie reviewer. Review these movie overviews: $documents.
Report which ones look outdated, why, and how urgent the rewrite is.
Respond in JSON: { "findings": [{ "title": "...", "issue": "...", "priority": "high" | "medium" | "low" }] }`,
    instructionParams: {
      documents: JSON.stringify(stale),
    },
    format: 'json',
  })) as unknown as Analysis

  const message = formatSlackMessage(analysis.findings, daysSince, stale)
  await postToSlack(message)
})

function formatSlackMessage(findings: Finding[], daysSince: number, stale: Movie[]): string {
  const idByTitle = new Map(stale.map((m) => [m.title, m._id]))
  const header = `*${findings.length} stale movies need attention* (no updates in ${daysSince}+ days)`
  const body = findings
    .map((f) => {
      const id = idByTitle.get(f.title)
      const link = STUDIO_URL && id ? ` (<${STUDIO_URL}/structure/movie;${id}|open in Studio>)` : ''
      return `*${f.title}*${link}\n${f.issue}\n_Priority: ${f.priority}_`
    })
    .join('\n\n')
  return `${header}\n\n${body}`
}

async function postToSlack(text: string): Promise<void> {
  const slack = new WebClient(SLACK_OAUTH_TOKEN)
  await slack.chat.postMessage({channel: SLACK_CHANNEL, text})
  console.log(`Posted to Slack channel ${SLACK_CHANNEL}`)
}
