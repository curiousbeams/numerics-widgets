// numerics-widgets kit — the numerical methods taught in TN23015, ported to
// dependency-free ES modules for the book's interactive widgets.
//
// Layout and UI primitives (controls, badge, row, SERIES, …) are not here: the
// widgets import them from em-kit by absolute URL,
//   https://curiousbeams.github.io/em-widgets/kit/ui.js
// so both collections of widgets look and behave the same.

export * from "./signal.js";
export * from "./diff.js";
export * from "./ode.js";
export * from "./pde.js";
export * from "./quad.js";
export * from "./roots.js";
