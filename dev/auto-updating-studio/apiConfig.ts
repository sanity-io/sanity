const staging = process.env.NODE_ENV == 'staging'

export const projectId = staging ? 'exx11uqh' : 'ppsg7ml5'
export const dataset = staging ? 'playground' : 'autoupdates'
