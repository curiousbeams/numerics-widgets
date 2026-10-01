// signal.js — sampling, aliasing and the discrete Fourier transform.
//
// Conventions follow numpy, because that is what the book teaches: `fft` is the
// unnormalised forward transform, `fftfreq` orders frequencies as
// [0, 1, …, n/2-1, -n/2, …, -1] / (n d), and `fftshift` moves zero to the middle.

/** Sample times n / fs for n = 0 … round(T fs) - 1, i.e. a trace of length T. */
export function sampleTimes(fs, T) {
  const n = Math.max(1, Math.round(T * fs));
  return Float64Array.from({length: n}, (_, i) => i / fs);
}

/**
 * The frequency a sampled sinusoid appears at: f folded into [-fs/2, fs/2).
 *
 * Signed, because sin(2π f t) sampled at fs is sin(2π f' t) at the sample
 * times with f' = f - k fs — and a negative f' is the same sine with its sign
 * flipped, which is visible in the samples.
 */
export function aliasFrequency(f, fs) {
  let fa = f - fs * Math.round(f / fs);
  if (fa >= fs / 2) fa -= fs;
  if (fa < -fs / 2) fa += fs;
  return fa;
}

/** numpy.fft.fftfreq(n, d). */
export function fftfreq(n, d = 1) {
  const out = new Float64Array(n);
  const half = Math.floor((n - 1) / 2) + 1;
  for (let i = 0; i < half; i++) out[i] = i / (n * d);
  for (let i = half; i < n; i++) out[i] = (i - n) / (n * d);
  return out;
}

/** numpy.fft.fftshift for a 1D array (returns a new array of the same type). */
export function fftshift(arr) {
  const n = arr.length;
  const shift = Math.floor(n / 2);
  const out = new arr.constructor(n);
  for (let i = 0; i < n; i++) out[(i + shift) % n] = arr[i];
  return out;
}

function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}

/**
 * Unnormalised forward DFT, numpy's sign convention: Y_k = Σ y_j e^{-2πi jk/n}.
 *
 * Radix-2 when n is a power of two, a direct O(n²) sum otherwise. The widgets
 * transform at most a few thousand samples, where the direct sum is still
 * instant, and it keeps `n` free for the reader to choose.
 *
 * @param {ArrayLike<number>} re real part
 * @param {ArrayLike<number>} [im] imaginary part (zeros if omitted)
 * @returns {{re: Float64Array, im: Float64Array}}
 */
export function fft(re, im) {
  const n = re.length;
  const xr = Float64Array.from(re);
  const xi = im ? Float64Array.from(im) : new Float64Array(n);
  if (n <= 1) return {re: xr, im: xi};
  if (!isPowerOfTwo(n)) return dft(xr, xi);

  // Bit-reversal permutation, then iterative butterflies.
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [xr[i], xr[j]] = [xr[j], xr[i]];
      [xi[i], xi[j]] = [xi[j], xi[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = xr[b] * cr - xi[b] * ci;
        const ti = xr[b] * ci + xi[b] * cr;
        xr[b] = xr[a] - tr; xi[b] = xi[a] - ti;
        xr[a] += tr; xi[a] += ti;
        const nr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nr;
      }
    }
  }
  return {re: xr, im: xi};
}

function dft(xr, xi) {
  const n = xr.length;
  const yr = new Float64Array(n), yi = new Float64Array(n);
  for (let k = 0; k < n; k++) {
    let sr = 0, si = 0;
    for (let j = 0; j < n; j++) {
      // Reduce jk mod n before the trig call, so large n keeps full precision.
      const ang = (-2 * Math.PI * ((j * k) % n)) / n;
      const c = Math.cos(ang), s = Math.sin(ang);
      sr += xr[j] * c - xi[j] * s;
      si += xr[j] * s + xi[j] * c;
    }
    yr[k] = sr; yi[k] = si;
  }
  return {re: yr, im: yi};
}

/** |Y_k| for a transform returned by {@link fft}. */
export function magnitude({re, im}) {
  return Float64Array.from(re, (r, k) => Math.hypot(r, im[k]));
}
