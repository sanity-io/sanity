# DocumentStatusIndicator

Which icons render for a document, given what is selected in the perspective bar. The same rules are
written out in prose in the doc comment on `DocumentStatusIndicator`, and every case below has a row
in the `document-status-debug` tool in the test studio.

```mermaid
flowchart TD
    Start([DocumentStatusIndicator]) --> P{"Selected perspective"}

    %% System bundle: describes publish state
    P -->|"System bundle:<br/>published or drafts"| SV{"Variant<br/>selected?"}
    SV -->|Yes| SE{"Document exists<br/>in the variant?"}
    SV -->|"No" | SD{"Default<br/>published?"}
    SE -->|"Yes: the variant takes over"| SP{"Variant<br/>published?"}
    SE -->|"No: falls back to<br/>the default documents"| SD

    SP -->|"Yes, with draft edits"| SA["Rhombus + yellow ring + green disc"]
    SP -->|"Yes, no draft edits"| SB["Rhombus + green disc"]
    SP -->|"No: draft only"| SC["Rhombus + yellow ring"]

    SD -->|"Yes, with draft edits"| SE1["Yellow ring + green disc"]
    SD -->|"Yes, no draft edits"| SF["Green disc"]
    SD -->|"No: draft only"| SG["Nothing"]

    %% Release or agent bundle: describes membership only
    P -->|"Release or<br/>agent bundle"| RV{"Variant<br/>selected?"}
    RV -->|Yes| RE{"Document in the release<br/>for the variant?"}
    RV -->|"No, or the variants<br/>store is still resolving"| RD{"Document in the release<br/>for the default documents?"}
    RE -->|"Yes: the variant is<br/>added on top"| RA["Rhombus + release icon"]
    RE -->|"No: falls back to<br/>the default version"| RD

    RD -->|Yes| RB["Release icon"]
    RD -->|No| RC["Nothing"]
```

Notes that the chart leaves out:

- Icons always render in a fixed order, whichever branch produced them: rhombus, release icon,
  yellow ring, green disc. At most three render at once.
- The release icon varies with the release: a bolt, clock, or dot by release type, and a
  suggest-toned dot for agent bundles, which have no release document.
