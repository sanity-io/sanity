/**
 * Get all recent deployments for a given branch
 */
export const currentBranch = `*[_type=='branch' && name == $branch] {
  "deployments": *[_type == 'deployment' && name=="performance-studio" && status=="succeeded" && branch._ref == ^._id]
} [count(deployments) > 0].deployments[]  | order(_createdAt asc) [0...$count] {"id": _id, url}`
