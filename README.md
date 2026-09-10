# North — website

The marketing site for [North](https://northfocus.app), a free-forever browser
extension that blocks short-form video and distracting sites.

Static HTML, CSS and a little vanilla JavaScript. No build step, no framework,
no package.json, and no runtime dependencies — the page loads nothing from a
CDN and uses the system UI font stack, so it renders identically offline.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Layout

```
index.html    the landing page
suggest.html  feature suggestion box (posts to Formspree)
goodbye.html  shown by the extension on uninstall
styles.css    the whole design system and every page's styles
script.js     nav, mobile menu, scroll reveals, FAQ
theme.js      light/dark, shared by every page (auto: light by day, dark after sunset)
assets/       icons, favicon, social preview image
llms.txt      a plain-language summary for language models
```

## Design

One pine green on cream, with a deep-green band carrying each of the two things
that differentiate North (the unlock, and the price). Tokens live at the top of
`styles.css` and mirror the extension's `pages/shared.css`, so the site and the
product stay in step.
