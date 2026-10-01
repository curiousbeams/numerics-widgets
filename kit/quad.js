// quad.js — the book's three quadrature rules on n equal slices of [a, b].
//
// Written exactly as the book defines them on n + 1 points x_0 … x_n:
//   simple sum   h (y_0 + … + y_{n-1})                        (left end points)
//   trapezoid    h ((y_0 + y_n)/2 + y_1 + … + y_{n-1})
//   Simpson      h/3 (y_0 + 4 y_1 + 2 y_2 + 4 y_3 + … + 4 y_{n-1} + y_n),  n even

function samples(f, a, b, n) {
  const h = (b - a) / n;
  return {h, y: Float64Array.from({length: n + 1}, (_, i) => f(a + i * h))};
}

export function simpleSum(f, a, b, n) {
  const {h, y} = samples(f, a, b, n);
  let s = 0;
  for (let i = 0; i < n; i++) s += y[i];
  return h * s;
}

export function trapezoid(f, a, b, n) {
  const {h, y} = samples(f, a, b, n);
  let s = (y[0] + y[n]) / 2;
  for (let i = 1; i < n; i++) s += y[i];
  return h * s;
}

export function simpson(f, a, b, n) {
  if (n % 2) throw new Error("Simpson's rule needs an even number of slices");
  const {h, y} = samples(f, a, b, n);
  let s = y[0] + y[n];
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * y[i];
  return (h / 3) * s;
}

export const RULES = {"simple sum": simpleSum, trapezoid, Simpson: simpson};
