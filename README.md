# numerics-widgets

Interactive widgets for the narrative of the TN23015 *Computational Science* textbook
(Curious Beams Lab, TU Delft), built as
[Observable Notebooks 2.0](https://observablehq.com/notebook-kit/) and embedded in the
book's MyST pages with `{anywidget}`.

This repository follows [em-widgets](https://github.com/curiousbeams/em-widgets) and
shares its machinery rather than copying it: the MyST wrapper
(`observable-notebook.mjs`) and the UI primitives (`kit/ui.js`: `controls`, `badge`,
`SERIES`, …) are imported from em-widgets by absolute URL. Read its README for the
conventions — shadow-root styling, one display cell per piece, why a cell that builds
DOM must not read a live input. Everything there applies here.

```
kit/                 numerical methods as taught in the book, dependency-free ES modules
notebooks/*.html     the widgets -> edit in Observable Desktop
test/                numeric tests against numpy/scipy, and the width/theme harness
tools/               fixture generation, a CORS dev server
demo/                a throwaway MyST project for checking the real render
```

## The widgets

| notebook | chapter | shows |
|---|---|---|
| `sampling-aliasing` | Fourier Transforms I | Nyquist frequency, aliasing, spectral resolution |
| `finite-difference-error` | Numerical Differentiation | secants, truncation vs round-off, 64- vs 32-bit |
| `ode-steppers` | ODEs I | Euler, RK2 and RK4 on a harmonic oscillator: phase space and energy drift |
| `ftcs-stability` | PDEs II | amplification factors: diffusion stable for r ≤ 1/2, wave equation never |
| `quadrature-error` | Numerical Integration | simple sum, trapezoid, Simpson: the areas they add and their error orders |
| `bisection-newton` | Root Finding | bracketing vs tangents, Newton's quadratic convergence and its failure modes |

## Embedding

```markdown
:::{anywidget} https://curiousbeams.github.io/em-widgets/observable-notebook.mjs
{
  notebook: "https://curiousbeams.github.io/numerics-widgets/notebooks/sampling-aliasing.html",
  cells: ["controlsView", "signalView", "spectrumView", "readoutView"],
}
:::
```

In the book, widgets go in the narrative only, never between `{exercise-start}` and
`{exercise-end}`: that prose is copied into the generated notebooks, where the
directive would arrive as raw text. And a widget must not do an exercise for the
reader — `finite-difference-error` sits *after* the exercise whose plot it reproduces.

## Developing

```sh
npm test                    # kit numerics against numpy/scipy fixtures
npm run serve               # CORS dev server on :8081, then open /test/
```

The harness rewrites the published kit URL to the local checkout, so kit edits show up
on reload. Regenerate the fixtures with any Python that has numpy and scipy:

```sh
python tools/generate-fixtures.py
```

`demo/` renders the widgets through a real `{anywidget}` directive against the local
server: `myst build --html` there, then serve `demo/_build/html`.

## Publishing

Pushing to `main` runs the tests and publishes the repository to GitHub Pages at
`https://curiousbeams.github.io/numerics-widgets/`. The book's pages point there, so a
widget appears on the site once it is pushed — no Curvenote rebuild needed, and none of
these files count towards Curvenote's upload limit.
