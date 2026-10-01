// diff.js — finite-difference derivatives, in double or emulated single precision.
//
// The book defines the centre difference with half steps,
//   f'_C(x, h) = [f(x + h/2) - f(x - h/2)] / h,
// so that all three formulas use the same spacing h between their two points.

const id = (v) => v;

/**
 * Forward, backward and centre differences of `f` at `x` with step `h`.
 *
 * With `single: true` every input, function value and arithmetic result is
 * rounded to float32 (`Math.fround`), which is what numpy does for float32
 * arrays — so the round-off floor sits where a float32 calculation puts it.
 * `f` itself is evaluated in double precision and its result rounded.
 */
export function differences(f, x, h, {single = false} = {}) {
  const r = single ? Math.fround : id;
  const X = r(x), H = r(h), half = r(H / 2);
  const fx = r(f(X));
  const fwd = r(r(r(f(r(X + H))) - fx) / H);
  const bwd = r(r(fx - r(f(r(X - H)))) / H);
  const cen = r(r(r(f(r(X + half))) - r(f(r(X - half)))) / H);
  return {forward: fwd, backward: bwd, centre: cen};
}

/** Machine epsilon of the chosen precision. */
export function machineEpsilon({single = false} = {}) {
  return single ? 2 ** -23 : Number.EPSILON;
}

/** n logarithmically spaced values from a to b inclusive (numpy.geomspace). */
export function geomspace(a, b, n) {
  const la = Math.log10(a), lb = Math.log10(b);
  return Float64Array.from({length: n}, (_, i) => 10 ** (la + ((lb - la) * i) / (n - 1)));
}
