---
source: stories/releases/ReleaseTime.stories.tsx
title: 'Releases/Release Time'
blocks: 6
roundtrip: true
sourceHash: 52bfc91e3be43060
---

<!-- @component -->

The distinction this component draws is between estimated and scheduled, and it is a distinction about state rather than about dates: the same field, rendered two different ways, means opposite things depending on whether the release has been committed to.

|        |                                                                     |
| ------ | ------------------------------------------------------------------- |
| Source | `packages/sanity/src/core/releases/tool/components/ReleaseTime.tsx` |
| Tier   | CHROME                                                              |

This is the "when" column of the releases table. It answers one question, when will this go live, and the answer has four genuinely different shapes. For asap and undecided releases there is no date to show, so it renders the release type as a word. For a scheduled release it renders a formatted timestamp, prefixed by whether that time is a commitment or a guess.

An active release with `intendedPublishAt` set has a date, but nothing is going to happen at that date on its own, it is the author's intent, so the label reads "Estimated". Move the release to the scheduled state and the same date becomes a commitment the system will act on, so the label reads "Scheduled" and a padlock appears. An interface that showed both as a bare timestamp would be lying about one of them.

The undecided case is dimmed to 50% opacity, which is the component quietly ranking its own output: a date you have not decided is worth less of the reader's attention than one you have.

The formatted time runs through `useTimeZone`, so these render in the viewing machine's timezone with an abbreviation appended when it differs from the release timezone. The fixture dates are fixed, the rendering of them is not. That same hook is why a component this simple needs the full studio provider stack, see the comment in the story source.

> **Why it matters:** same field, same rendering mechanism, opposite meaning depending on release state. A date is a promise about the future only once the release has been committed to; before that, it is just intent, and the label has to say so.

<!-- @story AllStates -->

The four states side by side, which is the only way to see that they are four states and not one. Asap and undecided render a word; the two scheduled rows render the same date differently, and only the locked one carries a padlock.

<!-- @story Estimated -->

An active release carrying `intendedPublishAt`. The date is real and the author picked it, but nothing will happen when it arrives unless somebody schedules or publishes the release. Hence "Estimated", and hence no padlock.

<!-- @story ScheduledAndLocked -->

The same date on a release in the `scheduled` state. The padlock is the message: the release is committed, its documents are read-only, and changing anything means unscheduling first. `isReleaseScheduledOrScheduling` covers the in-between moment while the schedule is being written, so the lock appears the instant the action is taken rather than after it lands.

<!-- @story ArchivedView -->

An archived or published release drops the "Estimated"/"Scheduled" prefix entirely and shows a bare timestamp. The prefix was a claim about the future; there is no future left to claim, so it goes.

<!-- @story InContext -->

Where it lives: one column of the releases overview, read down rather than across. Scanned this way the ranking does its work - the committed dates carry a padlock, the estimates read plainly, and the undecided row recedes.
