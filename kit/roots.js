// roots.js — bisection and Newton's method as step-by-step iterations.
//
// Both return their whole history, so a widget can show them one step at a time.

/**
 * Bisection on [a, b] (f(a) and f(b) must differ in sign), n halvings.
 * @returns {Array<{a: number, b: number, mid: number}>} the bracket before each halving and its midpoint
 */
export function bisectionSteps(f, a, b, n) {
  let fa = f(a);
  if (fa * f(b) > 0) throw new Error("the bracket must contain a sign change");
  const out = [];
  for (let i = 0; i < n; i++) {
    const mid = 0.5 * (a + b);
    out.push({a, b, mid});
    const fm = f(mid);
    if (fa * fm <= 0) b = mid;
    else { a = mid; fa = fm; }
  }
  return out;
}

/**
 * Newton's method x_{i+1} = x_i - f(x_i)/f'(x_i), at most n steps.
 * Stops early (returning what it has) if the derivative vanishes or the iterate is not finite.
 * @returns {number[]} x_0, x_1, …
 */
export function newtonSteps(f, fp, x0, n) {
  const xs = [x0];
  for (let i = 0; i < n; i++) {
    const x = xs[xs.length - 1];
    const d = fp(x);
    if (d === 0 || !Number.isFinite(d)) break;
    const next = x - f(x) / d;
    if (!Number.isFinite(next)) break;
    xs.push(next);
  }
  return xs;
}
