export interface SlackMessage {
  text?: string
  attachments?: SlackAttachment[]
}

export interface SlackField {
  type: 'section'
  text: {
    type: 'mrkdwn'
    text: string
  }
}

export interface SlackAttachment {
  blocks: SlackField[]
}
