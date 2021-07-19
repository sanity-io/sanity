import createClient from '@sanity/client'
import {forkJoin, Observable, of} from 'rxjs'
import {catchError, mapTo, mergeMap} from 'rxjs/operators'
import {Response} from './handleMessage'
import {getSlackChannelInfo} from './slack-api/getChannel'
import {getSlackMessage} from './slack-api/getMessage'
import {getSlackThread} from './slack-api/getThread'
import {getSlackPermalink} from './slack-api/getPermalink'
import {getSlackUser} from './slack-api/getUser'
import {Secrets} from './types'
import {nanoid} from 'nanoid'

const TICKET_OPEN_REACTION = 'ticket'
const TICKET_RESOLVE_REACTION = 'white_check_mark'
const CONTRIBUTION_REACTION = 'unicorn_face'

enum STATUS {
  Open = 'open',
  Resolved = 'resolved',
}

export const handleReaction = (event: any, secrets: Secrets): Observable<Response> => {
  const sanityClient = createClient({
    projectId: secrets.SANITY_PROJECT_ID,
    dataset: secrets.SANITY_DATASET,
    useCdn: false,
    token: secrets.SANITY_WRITE_TOKEN,
  })

  // open ticket
  if (event.type === 'reaction_added' && event.reaction === TICKET_OPEN_REACTION) {
    const slackThread$ = getSlackThread(
      secrets.SLACK_BOT_USER_TOKEN,
      event.item.channel,
      event.item.ts
    )
    const reactionAuthor$ = getSlackUser(secrets.SLACK_BOT_USER_TOKEN, event.user);
    const messageAuthor$ = getSlackUser(secrets.SLACK_BOT_USER_TOKEN, event.item_user);
    const channelInfo$ = getSlackChannelInfo(secrets.SLACK_BOT_USER_TOKEN, event.item.channel);
    const permalink$ = getSlackPermalink(
      secrets.SLACK_BOT_USER_TOKEN,
      event.item.channel,
      event.item.ts
    )
    const makeSanityThread = (thread: any) => {
      return thread.map((message: any) => ({
        _key: nanoid(),
        _type: 'message',
        content: message.text,
        author: message.user,
        timestamp: message.ts,
      }))
    }

    return forkJoin([slackThread$, reactionAuthor$, messageAuthor$, channelInfo$, permalink$]).pipe(
      mergeMap(([thread, reactionAuthor, messageAuthor, channelInfo, permalink]) => {
        if (reactionAuthor.profile.email.split('@').pop() !== secrets.EMAIL_DOMAIN) {
          throw `${reactionAuthor.profile.display_name} is not a Sanity domain user [#${channelInfo.name}].`
        }

        let ticketId = ''
        if (thread[0].client_msg_id) {
          ticketId = `slack-${thread[0].client_msg_id}`
        } else {
          ticketId = `slack-${thread[0].ts.replace(/\./g, '-')}`
        }

        console.log(`Opening ticket ${ticketId} in #${channelInfo.name}`)

        return sanityClient.createOrReplace({
          _id: ticketId,
          _type: 'ticket',
          thread: makeSanityThread(thread),
          openedBy: reactionAuthor.profile.display_name,
          authorName: messageAuthor.profile.display_name,
          channelName: channelInfo.name,
          status: STATUS.Open,
          permalink,
        })
      }),
      catchError((err) => {
        throw 'Ticket not opened: ' + err
      }),
      mapTo({status: 200, body: 'OK'})
    )
  }

  // close ticket
  if (event.type === 'reaction_added' && event.reaction === TICKET_RESOLVE_REACTION) {
    const slackMessage$ = getSlackMessage(
      secrets.SLACK_BOT_USER_TOKEN,
      event.item.channel,
      event.item.ts
    )
    const reactionAuthor$ = getSlackUser(secrets.SLACK_BOT_USER_TOKEN, event.user);

    return forkJoin([slackMessage$, reactionAuthor$]).pipe(
      mergeMap(([message, reactionAuthor]) => {
        if (reactionAuthor.profile.email.split('@').pop() !== secrets.EMAIL_DOMAIN) {
          throw `${reactionAuthor.profile.display_name} is not a domain user.`
        }

        let ticketId = ''
        if (message.client_msg_id) {
          ticketId = `slack-${message.client_msg_id}`
        } else {
          ticketId = `slack-${message.ts.replace(/\./g, '-')}`
        }

        console.log(`Closing ticket ${ticketId}`)

        return sanityClient
          .patch(ticketId)
          .set({status: STATUS.Resolved})
          .commit()
      }),
      catchError((err) => {
        throw 'Ticket not closed: ' + err
      }),
      mapTo({status: 200, body: 'OK'})
    )
  }

  // record community contribution
  if (event.type === 'reaction_added' && event.reaction === CONTRIBUTION_REACTION) {
    const slackMessage$ = getSlackMessage(
      secrets.SLACK_BOT_USER_TOKEN,
      event.item.channel,
      event.item.ts
    )
    const reactionAuthor$ = getSlackUser(secrets.SLACK_BOT_USER_TOKEN, event.user)
    const channelInfo$ = getSlackChannelInfo(secrets.SLACK_BOT_USER_TOKEN, event.item.channel)

    return forkJoin([slackMessage$, reactionAuthor$, channelInfo$]).pipe(
      mergeMap(([message, reactionAuthor, channelInfo]) => {
        const slackThread$ = getSlackThread(
          secrets.SLACK_BOT_USER_TOKEN,
          event.item.channel,
          message.thread_ts ? message.thread_ts : message.ts
        )
        const messageAuthor$ = getSlackUser(secrets.SLACK_BOT_USER_TOKEN, message.user)
        const permalink$ = getSlackPermalink(
          secrets.SLACK_BOT_USER_TOKEN,
          event.item.channel,
          message.thread_ts ? message.thread_ts : message.ts
        )
        const makeSanityThread = (thread: any) => {
          return thread.map((message: any) => ({
            _key: nanoid(),
            _type: 'message',
            content: message.text,
            author: message.user,
            timestamp: message.ts,
          }))
        }

        return forkJoin([slackThread$, messageAuthor$, permalink$]).pipe(
          mergeMap(([thread, messageAuthor, permalink]) => {

            console.log(`Recording contribution slack-contrib-${message.client_msg_id} in #${channelInfo.name}`)

            return sanityClient.createOrReplace({
              _id: `slack-contrib-${message.client_msg_id}`,
              _type: 'contribution',
              contribution: [{
                _key: nanoid(),
                _type: 'message',
                content: message.text,
                author: messageAuthor.profile.display_name,
                timestamp: message.ts,
              }],
              thread: makeSanityThread(thread),
              addedBy: reactionAuthor.profile.display_name,
              authorName: messageAuthor.profile.display_name,
              authorSlackId: message.user,
              channelName: channelInfo.name,
              permalink,
            })
          }),
          catchError((err) => {
            throw 'Contribution not recorded: ' + err
          }),
          mapTo({status: 200, body: 'OK'})
        )
      })
    )
  }

  // record all other reactions in Emoji Tracker
  if (event.type === 'reaction_added' &&
      event.reaction !== TICKET_OPEN_REACTION &&
      event.reaction !== TICKET_RESOLVE_REACTION &&
      event.reaction !== CONTRIBUTION_REACTION) {

    const author$ = getSlackUser(secrets.SLACK_BOT_USER_TOKEN, event.user);
    const channelInfo$ = getSlackChannelInfo(secrets.SLACK_BOT_USER_TOKEN, event.item.channel);
    const permalink$ = getSlackPermalink(
      secrets.SLACK_BOT_USER_TOKEN,
      event.item.channel,
      event.item.ts
    )

    const today = new Date()
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const yyyy = today.getFullYear()
    const emojiTrackerId = 'slack-emojis-' + dd + '-' + mm + '-' + yyyy

    return forkJoin([author$, channelInfo$, permalink$]).pipe(
      mergeMap(([author, channelInfo, permalink]) => {

        const query = `*[_type == 'emojiTracker' && _id == $id][0]`
        const params = {id: emojiTrackerId}

        type MultipleMutationResult = any

        return sanityClient.fetch(query, params).then((result: any): Promise<MultipleMutationResult> => {
          if (result) {
            console.log(`Adding to existing emoji record: ${emojiTrackerId}`)
            let emojiIndex = -1
            let emojiCount: number
            for (let i = 0; i < result.summary.length; i++) {
              if (result.summary[i].shortCode === event.reaction) {
                emojiIndex = i
                emojiCount = result.summary[i].count
              }
            }
            return sanityClient
              .transaction()
              .patch(emojiTrackerId, patch => patch
                .setIfMissing(
                  {entries: []},
                )
                .insert('after', 'entries[-1]', [
                  {
                    _key: nanoid(),
                    _type: 'emojiEntry',
                    shortCode: event.reaction,
                    colonCode: `:${event.reaction}:`,
                    authorName: author.profile.display_name,
                    authorSlackId: event.user,
                    channelName: channelInfo.name,
                    timestamp: event.event_ts,
                    permalink
                  }
                ])
              )
              .patch(emojiTrackerId, patch => patch
                .setIfMissing(
                  {summary: []},
                )
                .insert(emojiIndex >= 0 ? 'replace' : 'after', `summary[${emojiIndex}]`, [
                  {
                    _key: nanoid(),
                    _type: 'emojiSummary',
                    shortCode: event.reaction,
                    colonCode: `:${event.reaction}:`,
                    count: emojiCount ? emojiCount + 1 : 1
                  }
                ])
              )
            .commit()

          } else {
            console.log(`Creating new emoji record: ${emojiTrackerId}`)

            return sanityClient.create({
              _id: emojiTrackerId,
              _type: 'emojiTracker',
              date: today,
              summary: [
                {
                  _key: nanoid(),
                  _type: 'emojiSummary',
                  shortCode: event.reaction,
                  colonCode: `:${event.reaction}:`,
                  count: 1
                }
              ],
              entries: [
                {
                  _key: nanoid(),
                  _type: 'emojiEntry',
                  shortCode: event.reaction,
                  colonCode: `:${event.reaction}:`,
                  authorName: author.profile.display_name,
                  authorSlackId: event.user,
                  channelName: channelInfo.name,
                  timestamp: event.event_ts,
                  permalink
                }
              ]
            })
          }
        })
      }),
      catchError((err) => {
        throw 'Reaction not recorded: ' + err
      }),
      mapTo({status: 200, body: 'OK'})
    )
  }

  return of({status: 200, body: `Not handling :${event.reaction}:`})
}
