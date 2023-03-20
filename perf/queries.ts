/**
 * Get all recent deployments for a given branch
 */
export const branchDeploymentsQuery = `*[_type=='branch' && name == $branch] {
  "branchId": _id,
  "baseBranchId": *[_type=='branch' && name == ^.base][0]._id
} {
  "deployments": *[_type == 'deployment' && name=="performance-studio" && status=="succeeded" && (branch._ref in [^.branchId, ^.baseBranchId])]
} [count(deployments) > 0].deployments[]  | order(_createdAt asc) [0...$count] {_id, deploymentId, url, label}`
