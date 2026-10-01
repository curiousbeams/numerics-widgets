---
title: numerics-widgets demo
---

The notebooks as a MyST page embeds them, through `{anywidget}`, but read from the local server.

## Sampling and aliasing

:::{anywidget} https://curiousbeams.github.io/em-widgets/observable-notebook.mjs
{
  notebook: "http://127.0.0.1:8081/notebooks/sampling-aliasing.html",
  cells: ["controlsView", "signalView", "spectrumView", "readoutView"],
  rewriteImports: {"https://curiousbeams.github.io/numerics-widgets/": "http://127.0.0.1:8081/"},
}
:::
