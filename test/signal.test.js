import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

import {fft, fftfreq, fftshift, magnitude, aliasFrequency, sampleTimes} from "../kit/signal.js";

const {signal: fixtures} = JSON.parse(
  readFileSync(fileURLToPath(new URL("./fixtures/numerics.json", import.meta.url)), "utf8")
);

function assertClose(actual, expected, tol, what) {
  assert.equal(actual.length, expected.length, `${what}: length`);
  let worst = 0, at = -1;
  for (let i = 0; i < expected.length; i++) {
    const d = Math.abs(actual[i] - expected[i]);
    if (d > worst) { worst = d; at = i; }
  }
  assert.ok(worst <= tol,
    `${what}: max |diff| = ${worst.toExponential(3)} at ${at} (got ${actual[at]}, want ${expected[at]})`);
  return worst;
}

test("fft matches numpy.fft.fft, radix-2 and direct sizes", (t) => {
  for (const [name, f] of Object.entries(fixtures.fft)) {
    const Y = fft(f.re, f.im);
    const w = Math.max(assertClose(Y.re, f.Yre, 1e-10, `${name} re`),
                       assertClose(Y.im, f.Yim, 1e-10, `${name} im`));
    t.diagnostic(`${name}: max err ${w.toExponential(2)}`);
  }
});

test("fft does not modify its input", () => {
  const re = Float64Array.from([1, 2, 3, 4]);
  fft(re);
  assert.deepEqual([...re], [1, 2, 3, 4]);
});

test("fftfreq matches numpy.fft.fftfreq", () => {
  for (const [name, f] of Object.entries(fixtures.fftfreq)) {
    assertClose(fftfreq(f.n, f.d), f.f, 1e-15, name);
  }
});

test("fftshift matches numpy.fft.fftshift", () => {
  for (const [name, f] of Object.entries(fixtures.fftshift)) {
    assert.deepEqual([...fftshift(Float64Array.from(f.x))], f.y, name);
  }
});

test("|FFT| of a sampled sine matches numpy, including an aliased one", () => {
  for (const [name, s] of Object.entries(fixtures.sine)) {
    const t = sampleTimes(s.fs, s.T);
    const y = Float64Array.from(t, (ti) => Math.sin(2 * Math.PI * s.f * ti + 0.6));
    assertClose(magnitude(fft(y)), s.absY, 1e-9, name);
  }
});

test("aliasFrequency folds into [-fs/2, fs/2)", () => {
  const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-12, `${a} != ${b}`);
  close(aliasFrequency(0.3, 1), 0.3);
  close(aliasFrequency(1.1, 1), 0.1);   // the book's example
  close(aliasFrequency(0.9, 1), -0.1);  // folds to a sign-flipped 0.1 Hz
  close(aliasFrequency(1.0, 1), 0);     // indistinguishable from a constant
  close(aliasFrequency(0.5, 1), -0.5);  // Nyquist sits at the bottom edge
  close(aliasFrequency(2.3, 2), 0.3);
  for (const f of [0.07, 0.49, 1.37, 2.81]) {
    const fa = aliasFrequency(f, 1);
    assert.ok(fa >= -0.5 && fa < 0.5);
    // Same samples: sin(2π f n) == sin(2π fa n) for integer n.
    for (let n = 0; n < 20; n++) close(Math.sin(2 * Math.PI * f * n + 0.6), Math.sin(2 * Math.PI * fa * n + 0.6));
  }
});

test("sampleTimes covers a trace of length T", () => {
  const t = sampleTimes(100, 10);
  assert.equal(t.length, 1000);
  assert.equal(t[1], 0.01);
});
