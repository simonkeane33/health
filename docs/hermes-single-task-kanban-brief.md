# Hermes single-task kanban operating brief

This brief replaces the earlier epic-based planning approach. The goal is to make Hermes reliable under tight context limits by using only very small task cards, very small prompts, and a strict workflow where only one task may be in progress at any given time. The project remains the Obsidian-based health dashboard focused on food intake, beverage intake, and weight tracking.[cite:34]

## Core operating rule

There must never be more than one active task in the kanban board at the same time.

Active means any task in one of these states:

- In Progress
- Doing
- Implementing
- Reviewing, if Hermes is still actively working on it

If one task is active, Hermes must not pull, start, or expand another task.

## Why this rule exists

Hermes loses context when it tries to hold an epic, parent task, or multiple active implementation threads at once. The board must therefore behave like a single-thread execution queue, not a project tree. [cite:34]

## Board design

Use only these columns:

- Backlog
- Ready
- In Progress
- Done

Do not use:

- Epics
- Parent tasks
- Subtasks nested under larger tasks
- Multi-card initiatives in progress at the same time
- Review as a separate column unless review is fully manual and Hermes is not continuing work from that state

## Strict kanban rules

Hermes must follow these rules exactly:

1. Only one card may be in `In Progress` at any time.
2. Every card must be independently completable.
3. Every card must be small enough for one focused coding session.
4. Every card must have a visible outcome.
5. No card may depend on Hermes remembering a larger epic.
6. If a task is too large, Hermes must split it before starting work.
7. Hermes must finish or abandon the active card before touching another one.
8. Hermes must not create implementation plans longer than the current card requires.
9. Hermes must write short status updates only for the current card.
10. Hermes must move finished cards directly to `Done`.

## Card size rule

A card is valid only if it can be described in 3-6 short bullet points and completed without needing a parallel task.

Good card examples:

- Fix `Invalid Date` rendering in the entries table.
- Add calories target field to dashboard settings.
- Show today calories variance against target.
- Add a filter for `drink` entries.
- Add 7-day rolling average weight line.

Bad card examples:

- Improve dashboard analytics.
- Build target system.
- Redesign intake area.
- Implement food and drink breakdowns.

## Required card template

Every task card Hermes creates must use this exact lightweight structure:

```text
Title: [single clear outcome]
Why: [one sentence]
Do:
- [small implementation step]
- [small implementation step]
- [small implementation step]
Done when:
- [observable result]
- [observable result]
Notes:
- [dependency or none]
```

Rules for the card template:

- Title must describe one visible outcome.
- `Why` must be one sentence only.
- `Do` must contain 2-5 bullets only.
- `Done when` must contain 1-3 bullets only.
- `Notes` must be one short bullet or `none`.

## Prompting rule

Do not ask Hermes to plan multiple tasks at once. Do not ask Hermes to reason across the whole roadmap in one prompt. Instead, use one short prompt for board population and one short prompt for execution of a single selected task.

## Prompt 1: board population prompt

Use this prompt to create the board cards only.

```text
Create kanban cards for the health dashboard project using these strict rules:
- no epics
- no parent tasks
- no subtasks
- one independent task per card
- only one task may ever be in progress at a time
- each card must be small enough for one focused coding session
- use only the columns Backlog, Ready, In Progress, Done
- use the exact card template provided below
- create only the next 12 smallest useful cards
- keep scope limited to food intake, beverage intake, weight tracking, and dashboard data quality

Card template:
Title: [single clear outcome]
Why: [one sentence]
Do:
- [small implementation step]
- [small implementation step]
- [small implementation step]
Done when:
- [observable result]
- [observable result]
Notes:
- [dependency or none]
```

## Prompt 2: task execution prompt

Use this prompt only when one card has been moved to `In Progress`.

```text
Work only on the single kanban card currently in progress.
Do not plan other tasks.
Do not expand scope.
Do not reference epics.
Do not create follow-on cards unless the current task is too large to complete safely.
If the task is too large, stop and split it into 2-3 smaller replacement cards, then return without implementing anything else.
When finished, provide:
- what changed
- what files changed
- whether the card meets the done criteria
```

## Prompt 3: task splitting prompt

Use this only if Hermes stalls or says the current task is too large.

```text
Split the current kanban card into 2-4 smaller independent cards.
Keep each new card small enough for one focused coding session.
Use the same card template.
Do not implement anything yet.
Do not create epics or parent tasks.
```

## Prompt 4: done-check prompt

Use this after Hermes says a task is complete.

```text
Check the current task against its Done when section only.
Respond with one of:
- Done
- Not done
If not done, list only the missing items.
```

## Task creation policy for this project

All tasks must stay within these project boundaries:

In scope:

- Dashboard parsing reliability
- Date handling
- Daily summary correctness
- Calorie, protein, fluid, and weight targets
- Trend charts for intake and weight
- Meal and drink filters
- Entry inspection and correction visibility
- Mobile and usability polish

Out of scope:

- Sleep
- Recovery
- Readiness
- Exercise coaching
- Large redesigns
- Broad architecture changes unless required by the active card

## The first 12 kanban cards

Hermes should create these as separate individual cards in `Ready` or `Backlog`, with none in progress initially.

### Card 1

```text
Title: Fix Invalid Date rows in the entries table
Why: Date errors make the dashboard harder to trust.
Do:
- trace how entry dates are currently chosen for table rows
- add a fallback order for logged_at then entry_date
- render a safe placeholder only when both values are missing
Done when:
- valid entries no longer show Invalid Date
- truly missing dates show a consistent placeholder
Notes:
- depends on current parser only
```

### Card 2

```text
Title: Normalize dashboard date parsing for logged_at and entry_date
Why: Charts and tables need one consistent date parsing path.
Do:
- identify all places where date parsing happens
- create one shared date parsing helper
- replace duplicate parsing logic with the helper
Done when:
- table and chart dates use the same parsing rules
- duplicate date parsing logic is reduced
Notes:
- do after date row fix if easier
```

### Card 3

```text
Title: Add a data health card for missing and broken records
Why: Users need to see data issues before trusting trends.
Do:
- count entries with missing dates
- count entries with missing meal type
- count entries with missing calories or weight fields where relevant
- show these counts in a compact dashboard card
Done when:
- a visible data health card appears on the dashboard
- at least three issue counts are shown clearly
Notes:
- none
```

### Card 4

```text
Title: Distinguish missing daily data from zero values
Why: Zero calories and missing logs should not look the same.
Do:
- audit how daily summaries are built
- mark missing values separately from numeric zero
- update summary rendering to show the difference clearly
Done when:
- missing values and true zeros render differently
- charts do not imply intake where no data exists
Notes:
- depends on summary logic
```

### Card 5

```text
Title: Add calorie target setting to the dashboard
Why: A calorie target makes today totals actionable.
Do:
- choose a simple way to define a calorie target
- add a calorie target input or config value
- display the target in the dashboard state
Done when:
- the dashboard has a visible calorie target
- the target can be used by later KPI cards
Notes:
- keep implementation lightweight
```

### Card 6

```text
Title: Add protein target setting to the dashboard
Why: Protein is a key daily metric for food tracking.
Do:
- add a protein target input or config value
- store it in the same place as the calorie target
- expose it to KPI rendering
Done when:
- the dashboard has a visible protein target
- protein target data is available to later cards
Notes:
- align with calorie target approach
```

### Card 7

```text
Title: Add fluid target setting to the dashboard
Why: Fluid intake is already tracked and should have a target.
Do:
- add a fluid target input or config value
- wire it into dashboard state
- expose it to KPI rendering
Done when:
- the dashboard has a visible fluid target
- fluid target data is available to later cards
Notes:
- align with calorie target approach
```

### Card 8

```text
Title: Show today calories variance against target
Why: Users should see immediately whether they are under or over target.
Do:
- read today calorie total
- compare it with the configured calorie target
- show the variance in a KPI card or sublabel
Done when:
- today calories card shows target variance
- under and over states are visually distinct
Notes:
- depends on calorie target card
```

### Card 9

```text
Title: Show today protein variance against target
Why: Protein progress should be as visible as calorie progress.
Do:
- read today protein total
- compare it with the configured protein target
- show the variance in a KPI card or sublabel
Done when:
- today protein card shows target variance
- under and over states are visually distinct
Notes:
- depends on protein target card
```

### Card 10

```text
Title: Show today fluid variance against target
Why: Fluid tracking should be actionable in the same way as calories and protein.
Do:
- read today fluid total
- compare it with the configured fluid target
- show the variance in a KPI card or sublabel
Done when:
- today fluids card shows target variance
- under and over states are visually distinct
Notes:
- depends on fluid target card
```

### Card 11

```text
Title: Add a 7-day rolling average weight line
Why: Short-term weight smoothing makes trends easier to understand.
Do:
- calculate a 7-day rolling average from weight history
- add the line to the existing weight trend area
- label it clearly so it differs from raw weight values
Done when:
- a 7-day rolling average weight line is visible
- the legend clearly distinguishes it from raw weight
Notes:
- none
```

### Card 12

```text
Title: Add a meal-type filter for breakfast lunch dinner snack and drink
Why: Filtering by meal type makes the entries table more useful.
Do:
- add a meal-type filter control
- filter the entries table based on the selected value
- keep all entries visible when no filter is selected
Done when:
- users can filter entries by meal type
- clearing the filter restores the full table
Notes:
- none
```

## Daily workflow Hermes must follow

At the start of each work cycle:

1. Check whether any card is already in `In Progress`.
2. If yes, work only on that card.
3. If no, move exactly one card from `Ready` to `In Progress`.
4. Complete that card or split it smaller.
5. Move it to `Done` when finished.
6. Stop.

Hermes must not automatically start the next card in the same cycle.

## Minimal status update format

Hermes should use this short update style to save context:

```text
Current card: [title]
Status: [working | blocked | done]
Changed:
- [short item]
- [short item]
Next:
- [one short item]
```

## Final instruction to Hermes

Use the single-task kanban system in this brief from now on. Do not use epics. Do not hold multi-step initiatives in active memory. Work one small card at a time, finish it, then stop. Keep the project scope tightly focused on food intake, beverage intake, weight tracking, and dashboard reliability.[cite:34]
