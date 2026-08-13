# Animated Hero Preview Design

**Date:** 2026-08-13
**Status:** Approved direction, pending implementation
**Surface:** GitHub Pages hero workbench

## Objective

Update the hero workbench so it demonstrates Diago's expanded software-engineering diagram catalog instead of presenting one mostly static checkout architecture. The preview must remain an honest product demonstration: each state answers a distinct engineering question and uses the vocabulary of a renderer Diago actually supports.

Success means a visitor can understand, within one animation cycle, that Diago has eight purpose-specific engineering views and can select the view that best answers the reader's question without losing evidence status or reviewability.

## Selected Direction

Use one accessible, auto-playing workbench with all eight supported views:

1. **Architecture** — checkout request boundaries and dependencies.
2. **Sequence** — request, reservation, authorization, persistence, and response order.
3. **Workflow** — a schema rollout with decisions, gates, rollback, and owners.
4. **Dataflow** — payment events from source through transformation and storage.
5. **Lifecycle** — payment states, transition guards, failures, and recovery.
6. **Data model** — order, payment, and idempotency relationships.
7. **Timeline** — an evidence-aware payment migration sequence.
8. **Layers** — where checkout responsibilities and controls are enforced.

The preview advances every five seconds, producing a 40-second complete cycle. A visible pause/play control gives the visitor direct control. Selecting a tab changes the view immediately and restarts the interval from that selection.

This direction is preferred over a manual-only preview because motion communicates that Diago selects different views for different engineering questions. It is preferred over animating only the existing architecture because that would leave the hero visually tied to the old, narrower catalog.

## Interaction Model

- The active view is the sole visible panel and its tab has `aria-selected="true"`.
- Auto-play advances Architecture → Sequence → Workflow → Dataflow → Lifecycle → Data model → Timeline → Layers → Architecture.
- Hovering the workbench, focusing any control inside it, or hiding the browser document pauses the timer without changing the user's explicit pause/play choice.
- The pause/play control communicates its action in both visible text and an accessible label.
- Clicking a tab activates it, updates the filename and context label, and restarts the timer when auto-play remains enabled.
- Left and Right Arrow move between tabs in catalog order. Home selects Architecture; End selects Layers. Focus follows the selected tab.
- Only the active tab is in the tab sequence; inactive tabs use `tabindex="-1"`.
- When `prefers-reduced-motion: reduce` matches, Architecture remains selected, auto-play does not start, and all reveal or trace animations are disabled.

## Motion Language

Motion explains construction and flow rather than decorating the page:

- A newly active panel enters with a short opacity and vertical-transform reveal.
- Diagram nodes or milestones resolve in reading order.
- Current relationships draw first; proposed or assumed relationships follow with their existing dashed semantics.
- The active tab shows a restrained five-second progress indicator while auto-play is running.
- Animation uses only `opacity` and `transform` for panel and object reveals. SVG stroke-dash animation may be used for relationship tracing because it communicates edge direction and does not trigger layout.
- There is no constant floating, pulsing, or parallax motion.

## Workbench Content

Each view updates the title-bar filename and a concise screen-reader description:

| View | Filename | Engineering question |
|---|---|---|
| Architecture | `checkout-feature.architecture.json` | What exists, who owns it, and how do the boundaries connect? |
| Sequence | `checkout-request.sequence.json` | What happens over time between the caller, services, and providers? |
| Workflow | `schema-rollout.workflow.json` | Which steps, decisions, approvals, and failure paths control the work? |
| Dataflow | `payment-events.dataflow.json` | Where does data begin, transform, move, and persist? |
| Lifecycle | `payment.lifecycle.json` | How does a payment change state, and which guards allow each transition? |
| Data model | `order-domain.data-model.json` | Which entities exist and how are their relationships constrained? |
| Timeline | `payment-migration.timeline.json` | Which engineering milestones happen, and in what temporal relationship? |
| Layers | `checkout-controls.layers.json` | Where are responsibilities and controls enforced? |

Evidence is not a ninth tab because it is a cross-cutting semantic layer rather than a renderer. The footer retains verified, assumption, current, and proposed semantics across all eight views. Each panel uses compact SVG or semantic HTML drawn from the existing Diago visual language; no screenshot or rendered bitmap is embedded.

## Implementation Boundaries

- `docs/index.html` owns the eight tab controls, eight preview panels, accessible labels, filenames, and pause/play control.
- `docs/styles.css` owns the existing workbench material, active states, responsive tab overflow, progress indicator, and reduced-motion behavior.
- `docs/app.js` owns a small preview controller: selected index, explicit playback state, temporary pause reasons, interval lifecycle, keyboard navigation, filename changes, and document visibility handling.
- No dependency, framework, build step, analytics hook, or remote asset is added.
- JavaScript is progressive enhancement. The Architecture panel is visible and usable before JavaScript runs; the playback control is revealed only after initialization.

## Responsive Behavior

- Desktop retains the current two-column hero and workbench dimensions.
- Tablet and mobile retain the existing stacked hero.
- At desktop and tablet widths, the view switcher uses a compact four-column by two-row grid so all eight views remain discoverable without shrinking labels.
- At mobile widths, the view switcher becomes a single horizontally scrollable, scroll-snapping rail. Selecting or auto-advancing a view brings its tab into the nearest visible position without moving the page.
- Tab labels remain on one line, the pause/play control remains reachable, and SVG labels retain the current minimum readable scale.
- The workbench title may truncate with an ellipsis; the complete filename remains available through its accessible label or title.

## Accessibility

- Use the WAI-ARIA tabs pattern: `tablist`, `tab`, `tabpanel`, `aria-controls`, `aria-labelledby`, roving `tabindex`, and keyboard navigation.
- The automatic content change always has an adjacent pause/play control.
- Pausing on focus prevents the preview from changing while a keyboard or assistive-technology user is operating it.
- Focus treatment follows the page's existing visible focus system.
- Text and semantic colors keep the existing contrast contract; color is never the only evidence-status signal.
- Reduced-motion behavior disables automatic changes as well as animations.

## Failure Handling

- If JavaScript does not load, Architecture remains visible, other panels remain hidden, and no inert pause control is shown.
- Starting a new timer always clears the previous timer, preventing duplicate cycles.
- Document visibility and hover/focus pauses are independent, so removing one pause reason cannot accidentally resume while another remains active.
- Manual tab selection remains functional after any auto-play pause or resume transition.

## Verification

Implementation is complete only after all of the following pass:

- Repository validation and JavaScript syntax checks.
- Automated browser checks for tab selection, five-second advancement, pause/play, hover and focus pauses, keyboard navigation, filename updates, document visibility handling where testable, and reduced-motion behavior.
- Fresh visual captures at 375, 768, and 1280 CSS pixels showing every settled view plus the pause/play and active-progress states. The mobile evidence set must show the beginning, middle, and end of the tab rail.
- No clipping, overlap, unreadable text, page-level horizontal overflow, or focus loss.
- Two independent visual-QA review passes on the same fresh evidence set.
- GitHub Pages deployment succeeds and the live page contains all eight renderer tabs and panels.

## Out of Scope

- Adding a ninth diagram renderer.
- Restoring Evidence as a ninth workbench tab; evidence remains visible inside every renderer example.
- Allowing arbitrary user-authored animation in generated diagram artifacts.
- Replacing the existing landing-page brand, typography, section order, or hero copy.
- Loading full production renderer artifacts inside the marketing page.
- Adding video, canvas, WebGL, or an animation library.
