export interface YarnErrorEvent {
  type: 'error'
  data: string
}

export interface YarnWarningEvent {
  type: 'warning'
}

export interface YarnStepEvent {
  type: 'step'
  data: {message: string}
}

export interface YarnActivityStartEvent {
  type: 'activityStart'
}

export interface YarnActivityTickEvent {
  type: 'activityTick'
  data: {
    name: string
  }
}

export interface YarnActivitySetEndEvent {
  type: 'activitySetEnd'
}

export interface YarnActivityEndEvent {
  type: 'activityEnd'
}

export interface YarnProgressStartEvent {
  type: 'progressStart'
  data: {
    total: number
  }
}

export interface YarnProgressTickEvent {
  type: 'progressTick'
  data: {
    current: number
  }
}

export interface YarnProgressFinishEvent {
  type: 'progressFinish'
}

export interface YarnSuccessEvent {
  type: 'success'
}

export interface YarnFinishedEvent {
  type: 'finished'
  data: number
}

export type YarnEvent =
  | YarnErrorEvent
  | YarnWarningEvent
  | YarnStepEvent
  | YarnActivityStartEvent
  | YarnActivityTickEvent
  | YarnActivitySetEndEvent
  | YarnActivityEndEvent
  | YarnProgressStartEvent
  | YarnProgressTickEvent
  | YarnProgressFinishEvent
  | YarnSuccessEvent
  | YarnFinishedEvent
