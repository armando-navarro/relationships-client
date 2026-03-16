# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server (proxies API to localhost:3000)
npm run build      # Production build → outputs to ../relationships-server/client/
npm run watch      # Dev build with file watching
npm test           # Karma/Jasmine unit tests
```

To run a single test file, pass `--include` to the karma config:
```bash
npx ng test --include='src/app/shared/api.spec.ts'
```

There is no lint script configured.

## Architecture

**Purpose:** A personal relationship-tracking SPA. Users track "Relationships" (contacts with interaction rate goals) and "Interactions" (logged calls/visits/etc.). The app computes attention-needed status per relationship (Overdue / Due Today / Due Soon / No Attention Needed) and groups cards accordingly.

**Stack:** Angular 21 (standalone components, signals) · Angular Material 21 · RxJS 7 · Luxon 3 · Karma/Jasmine · SCSS

**Backend:** A separate Node/Express/MongoDB repo at `../relationships-server`. In production, the build output is served directly by Express. In development, API calls proxy to `http://localhost:3000/api` via the dev environment file.

### App Bootstrap

No `AppModule`. Uses `ApplicationConfig` in `src/app/app.config.ts` with:
- `provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling(...))`
- `provideHttpClient()`
- Angular Material defaults (dialog, icon, snackbar, tooltip)
- `provideBrowserGlobalErrorListeners()`

### Routing

Eagerly loaded routes in `src/app/app.routes.ts`:
- `/` → redirects to `/welcome`
- `/welcome` → `Welcome`
- `/relationships` → `RelationshipsList`
- `/interactions` → `InteractionsList`
- `**` → `PageNotFound`

### State Management

No NgRx or external store. State is managed with Angular Signals directly inside page components:
- `signal()` for mutable local state
- `computed()` for derived state
- `linkedSignal()` for state that resets when a source signal changes
- `effect()` for signal-triggered side effects
- `toObservable()` to bridge signals into RxJS (e.g. debounced search)

### Services

Most services use `providedIn: 'root'`. Exception: `RelationshipForm` uses `@Injectable()` (no `providedIn`) and is scoped to the dialog component that provides it.

| Service | Role |
|---|---|
| `Api` | All HTTP calls; maps responses via mapper services |
| `Relationships` | Business logic for relationship CRUD + dialog orchestration |
| `Interactions` | Business logic for interaction CRUD + dialog orchestration |
| `RelationshipForm` | Manages the reactive form state inside the relationship dialog; scoped (not root) |
| `Deletion` | Generic delete-with-confirmation dialog flow |
| `RelationshipMapper` | Maps API response ↔ internal model + reactive form group |
| `InteractionMapper` | Maps API response ↔ internal model + reactive form group |
| `RelationshipUtilities` | Sorts/orders relationship groups by `AttentionNeededStatus` |
| `InteractionUtilities` | Shared interaction manipulation logic (e.g. inserting in order) |
| `MaterialConfig` | Builds responsive `MatDialogConfig` objects |
| `ResponsiveUi` | Exposes `isSmallViewport` signal via `matchMedia`/`ResizeObserver` |
| `Scroll` | Manages scroll behavior across pages |

### Component Organization

```
src/app/
  interactions/   # Interaction feature: service, mapper, utilities, dialogs, list page
  relationships/  # Relationship feature: service, mapper, utilities, form, dialogs, list page
  shared/         # Cross-feature components and services (Card, CardGroup, Row, PageHeaderBar, dialogs, pipes, ...)
  topics/         # Topic feature: buttons component, dialog
  welcome/        # Welcome page
  page-not-found/ # 404 page
```

The `Card` component (`src/app/shared/card/`) is polymorphic — it renders a relationship, interaction, or topic based on which input is provided (`relationship`, `interaction`, or `topic`).

### Pipes

| Pipe | Role |
|---|---|
| `SimpleDatePipe` | Formats `Date \| null` to a short locale string |
| `NewlinesToBrPipe` | Replaces `\n` with `<br>` for display in HTML |
| `TopicFormToModelPipe` | Converts a topic form group value to a `Topic` model |

Import pipes explicitly in the `imports` array of components that use them in templates.

### Data Model

Interfaces are co-located with their feature area rather than in a central `interfaces/` folder:
- `relationships/relationship-interface.ts` — `Relationship`, `RelationshipResponse`, `RelationshipGroup`, `AttentionNeededStatus` enum, `InteractionRate` enum
- `interactions/interaction-interface.ts` — `Interaction`, `InteractionResponse`, `InteractionGroup`, `InteractionType` enum, `Topic`
- `shared/misc-interface.ts` — `Cancelable`, `InsertedId`

Key types:
- `Relationship` / `RelationshipResponse` — internal model vs. API shape; dates are `Date` internally, `string` from API
- `AttentionNeededStatus` enum — `Overdue | Due Today | Due Soon | No Attention Needed | Due Date N/A`
- `InteractionRate` enum — the goal frequency for a relationship (e.g. `every week`, `every month`)
- `RelationshipGroup` — a group of relationships sharing the same `AttentionNeededStatus`, used for card-group display

## Coding Rules

- **Do NOT set `standalone: true`** in `@Component`/`@Directive` decorators — it is the default in Angular v21+.
- Use `input()` / `output()` functions, not `@Input()`/`@Output()` decorators.
- All components must have `changeDetection: ChangeDetectionStrategy.OnPush`.
- Use the `host` object for host bindings — do NOT use `@HostBinding`/`@HostListener`.
- Use native control flow (`@if`, `@for`, `@switch`) — do NOT use `*ngIf`, `*ngFor`, `*ngSwitch`.
- Use `class` and `style` bindings — do NOT use `ngClass` or `ngStyle`.
- Use `inject()` function — do NOT use constructor injection.
- Reactive Forms only — no Template-driven forms.
- Use signals for state; `computed()` for derived state; do NOT use `mutate()`.
- All components must pass AXE accessibility checks and meet WCAG AA minimums (focus management, color contrast, ARIA attributes).
- Use `NgOptimizedImage` for static images (does not work for inline base64).
- Avoid `any`; use `unknown` when the type is uncertain. Prefer type inference when the type is obvious.
- Do not assume globals like `new Date()` are available in templates — compute values in the component class.
- When a component uses external template/style files, keep logic in the `.ts`, styles in the `.scss`, and markup in the `.html`. Use paths relative to the component `.ts` file.
- Use the `async` pipe to handle observables in templates.
