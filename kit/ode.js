// ode.js — the explicit one-step ODE methods of the book: Euler, RK2 (midpoint) and RK4.
//
// The state is a plain array of numbers; `f(y, t)` returns dy/dt as an array of
// the same length. RK2 is the midpoint method exactly as the book writes it:
//   k1 = h f(y, t),  k2 = h f(y + k1/2, t + h/2),  y_{n+1} = y_n + k2.

const axpy = (y, a, k) => y.map((yi, i) => yi + a * k[i]);

export function eulerStep(f, y, t, h) {
  return axpy(y, h, f(y, t));
}

export function rk2Step(f, y, t, h) {
  const k1 = f(y, t);
  const k2 = f(axpy(y, h / 2, k1), t + h / 2);
  return axpy(y, h, k2);
}

export function rk4Step(f, y, t, h) {
  const k1 = f(y, t);
  const k2 = f(axpy(y, h / 2, k1), t + h / 2);
  const k3 = f(axpy(y, h / 2, k2), t + h / 2);
  const k4 = f(axpy(y, h, k3), t + h);
  return y.map((yi, i) => yi + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

export const STEPPERS = {Euler: eulerStep, RK2: rk2Step, RK4: rk4Step};

/**
 * Integrate n steps of size h from (y0, t0) with the given stepper.
 * @returns {{t: Float64Array, y: number[][]}} times and states, n + 1 of each
 */
export function integrate(f, y0, t0, h, n, step = rk4Step) {
  const t = new Float64Array(n + 1);
  const y = new Array(n + 1);
  t[0] = t0;
  y[0] = Array.from(y0);
  for (let i = 0; i < n; i++) {
    y[i + 1] = step(f, y[i], t[i], h);
    t[i + 1] = t0 + (i + 1) * h;
  }
  return {t, y};
}
