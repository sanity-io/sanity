import createClient from '@sanity/client'
import {forkJoin, Observable, of} from 'rxjs'
import {catchError, mapTo, mergeMap} from 'rxjs/operators'
import {handleReaction} from './handleReaction'
import {getSlackChannelInfo} from './slack-api/getChannel'
import {getSlackMessage} from './slack-api/getMessage'
import {getSlackReactions} from './slack-api/getReactions'
import {getSlackUser} from './slack-api/getUser'
import {Secrets} from './types'
import {nanoid} from 'nanoid'

const TICKET_OPEN_REACTION = 'ticket'

export interface Response {
  status: number
  headers?: {}
  body: string
}

export function handleMessage(secrets: Secrets) {
  return (message: any): Observable<Response> => {
    const sanityClient = createClient({
      projectId: secrets.SANITY_PROJECT_ID,
      dataset: secrets.SANITY_DATASET,
      useCdn: false,
      token: secrets.SANITY_WRITE_TOKEN,
    })

    const hasTicket = (arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].name === TICKET_OPEN_REACTION) {
          return true
        }
      }
      return false
    }

    if (message.challenge) {
      return of({status: 200, headers: {'Content-Type': 'text/plain'}, body: message.challenge});
    }

    if (message.type === 'event_callback') {
      if (message.event.type === 'reaction_added' || message.event.type === 'reaction_removed') {
        return handleReaction(message.event, secrets)
      }

      if (message.event.type === 'message' && message.event.thread_ts) {
        const slackReactions$ = getSlackReactions(
          secrets.SLACK_BOT_USER_TOKEN,
          message.event.channel,
          message.event.thread_ts
        )

        return slackReactions$.pipe(
          mergeMap((reactions) => {
            if (reactions && reactions.reactions && hasTicket(reactions.reactions)) {
              const ticketId = `slack-${reactions.client_msg_id}`;
              const slackMessage$ = getSlackMessage(
                secrets.SLACK_BOT_USER_TOKEN,
                message.event.channel,
                message.event.ts
              )
              const messageAuthor$ = getSlackUser(secrets.SLACK_BOT_USER_TOKEN, message.event.user)

              return forkJoin([slackMessage$, messageAuthor$]).pipe(
                mergeMap(([message, author]) => {
                  console.log(`Adding message to existing ticket ${ticketId}`)

                  return sanityClient
                    .patch(ticketId)
                    .setIfMissing({thread: []})
                    .insert('after', 'thread[-1]', [
                      {
                        _key: nanoid(),
                        _type: 'message',
                        content: message.text,
                        author: author.profile.display_name,
                        timestamp: message.ts,
                      },
                    ])
                    .commit()
                })
              )
            } else {
              throw 'No open ticket found.'
            }
          }),
          catchError((err) => {
            throw 'Message ignored: ' + err
          }),
          mapTo({status: 200, body: 'OK'})
        )
      }

      if (message.event.subtype === 'message_changed') {
        const slackReactions$ = getSlackReactions(
          secrets.SLACK_BOT_USER_TOKEN,
          message.event.channel,
          message.event.message.thread_ts
        )

        return slackReactions$.pipe(
          mergeMap((reactions) => {
            if (reactions && reactions.reactions && hasTicket(reactions.reactions)) {
              const ticketId = `slack-${reactions.client_msg_id}`;
              const slackMessage$ = getSlackMessage(
                secrets.SLACK_BOT_USER_TOKEN,
                message.event.channel,
                message.event.message.ts
              )
              const messageAuthor$ = getSlackUser(
                secrets.SLACK_BOT_USER_TOKEN,
                message.event.message.user
              )

              return forkJoin([slackMessage$, messageAuthor$]).pipe(
                mergeMap(([message, author]) => {
                  const query = `*[_type == 'ticket' && _id == $ticketId][0] { thread }`
                  const params = {ticketId: ticketId}

                  return sanityClient.fetch(query, params).then((result) => {
                    for (let i = 0; i < result.thread.length; i++) {
                      if (result.thread[i].timestamp === message.ts) {
                        console.log(`Modifying message in existing ticket ${ticketId}`)

                        return sanityClient
                          .patch(ticketId)
                          .setIfMissing({thread: []})
                          .insert('replace', `thread[${i}]`, [
                            {
                              _key: nanoid(),
                              _type: 'message',
                              content: message.text,
                              author: author.profile.display_name,
                              timestamp: message.ts,
                            },
                          ])
                          .commit()
                      }
                    }
                  })
                })
              )
            } else {
              throw 'No open ticket found.'
            }
          }),
          catchError((err) => {
            throw 'Message ignored: ' + err
          }),
          mapTo({status: 200, body: 'OK'})
        );
      }
    }
    return of({status: 200, body: `Don't know how to handle message ${message._type}`})
  };
}
