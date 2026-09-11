# North

The website for [North](https://northfocus.app), a free browser extension that blocks distracting sites and short-form video.

## Run locally

```bash
python -m http.server 8000
```

Open http://localhost:8000. Static HTML, CSS and vanilla JavaScript; no build step or runtime framework. Fonts are served locally. The existing Vercel website analytics and Formspree suggestion endpoint remain in place.

## Files

- `index.html` — landing page and structured search metadata
- `styles.css` — shared design system, responsive layouts and motion
- `script.js` — preview tabs and switches, navigation, scroll reveals and pause sequence
- `theme.js` — shared light/dark preference, with a local daytime default
- `suggest.html`, `suggest.js` — existing feature suggestion form
- `goodbye.html` — uninstall page
- `assets/north-mark.svg`, `assets/north-symbols.svg` — compass mark and UI symbols
- `assets/og-image.png` — branded social preview
- `assets/fonts/` — locally hosted DM Sans and Instrument Serif, with OFL licenses

## Brand and motion

“A little less feed. A little more life.” Warm paper, pine green, an editorial serif and a quiet sans-serif interface. Copy offers a choice without shame or urgency. Theme tokens live at the top of `styles.css`.

The extension interface is an interactive website preview; its switches do not change browser settings. Feature tabs support arrow keys, Home and End. The three-stage pause sequence follows scrolling on taller desktop screens and can also be navigated with its tabs. Mobile, short viewports and reduced-motion preferences get an unpinned layout with all three steps explained. Below-the-fold reveals use IntersectionObserver, and content stays visible without JavaScript.

The theme button saves a preference locally when storage is available. Otherwise the site follows local daytime (light from 7am to 7pm).

## Verification

Reviewed in headless Edge at widths from 320px to 1440px. Checked preview switches, tab keyboard navigation, pause chapters, mobile menu, FAQs, saved themes, reduced motion and the no-JavaScript fallback. Automated axe checks cover WCAG 2.1 A/AA on all three pages in both themes. The suggestion form was checked without sending a submission.
