export const partialASAPReleaseMetadata = {
  title: 'ASAP Release A',
  description: '',
  releaseType: 'asap',
}

export const partialUndecidedReleaseMetadata = {
  title: 'Undecided Release A',
  description: '',
  releaseType: 'undecided',
}

export const partialScheduledReleaseMetadata = {
  title: 'Scheduled Release A',
  description: '',
  releaseType: 'scheduled',
  // tomorrow
  intendedPublishAt: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
}
