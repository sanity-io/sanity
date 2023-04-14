/**
 * Get all recent deployments for a given branch
 */
export const branchDeploymentsQuery = `*[_type=='branch' && name == $branch] {
  "branchId": _id,
  "baseBranchId": *[_type=='branch' && name == ^.base][0]._id
} {
  "deployments": [
    ...*[_type == 'deployment' && name=="performance-studio" && status=="succeeded" && (branch._ref in [^.branchId])],
    *[_type == 'deployment' && name=="performance-studio" && status=="succeeded" && (branch._ref in [^.baseBranchId])] | order(_createdAt desc)[0]
    ]
} [count(deployments) > 0].deployments[] | order(_createdAt desc) [0...$count] {_id, deploymentId, url, label}`

export const tagsDeploymentsQuery = `*[_type=='tag'] | order(_createdAt desc) {
  "tagName": name,
  commit,
  _createdAt,
  "deployment": *[_type == 'deployment' && name=="performance-studio" && status=="succeeded" && defined(meta.githubCommitSha) && meta.githubCommitSha==^.commit] | order(_createdAt desc)[0]
} [defined(deployment)] | order(deployment._createdAt desc) [0...$count] {...deployment, "label": tagName} {_id, deploymentId, url, label}`
