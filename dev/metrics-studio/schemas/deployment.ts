// todo: convert to zod and validate json payload
export const deploymentMetadata = {
  type: 'object',
  name: 'deploymentMetadata',
  fields: [
    {name: 'githubCommitAuthorName', type: 'string'},
    {name: 'githubCommitMessage', type: 'string'},
    {name: 'githubCommitOrg', type: 'string'},
    {name: 'githubCommitRef', type: 'string'},
    {name: 'githubCommitRepo', type: 'string'},
    {name: 'githubCommitRepoId', type: 'string'},
    {name: 'githubCommitSha', type: 'string'},
    {name: 'githubDeployment', type: 'string'},
    {name: 'githubOrg', type: 'string'},
    {name: 'githubRepo', type: 'string'},
    {name: 'githubRepoId', type: 'string'},
    {name: 'githubCommitAuthorLogin', type: 'string'},
  ],
}

export const deployment = {
  type: 'document',
  name: 'deployment',
  fields: [
    {name: 'projectName', type: 'string'},
    {name: 'projectId', type: 'string'},
    {name: 'deploymentId', type: 'string'},
    {name: 'deploymentType', type: 'string'},
    {name: 'meta', type: 'deploymentMetadata'},
    {name: 'name', type: 'string'},
    {name: 'url', type: 'string'},
    {name: 'inspectorUrl', type: 'string'},
    {name: 'plan', type: 'string'},
    {name: 'regions', type: 'array', of: [{type: 'string'}]},
  ],
}
