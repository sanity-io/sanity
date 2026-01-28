### Description

There's currently no good way to take schema errors in the browser and feed them to an LLM other than selecting the text manually and pasting it into your chat. This PR converts schema errors to markdown in a format friendly to paste into an LLM.

<img width="1120" height="815" alt="Screenshot 2025-09-08 at 13 41 32" src="https://github.com/user-attachments/assets/51b9c4ad-7f03-4b40-97ad-676c90f73b7d" />

### What to review

1. GPT-5 helped me write this PR. I have added a new hook because there seems to be no hook available to copy plain text to the clipboard. Only the studio's Copy/Paste Fields function which is very different.
2. I'm not sure if I need to do anything more with the localization on this. I _think_ I've used all existing keys for the strings.

### Testing

I did not add testing; should I?

### Notes for release

Schema errors screen now contains a button to copy schema type errors as Markdown.
