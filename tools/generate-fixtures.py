#!/usr/bin/env python
"""Regenerate the reference values the kit is tested against.

The book teaches these methods with numpy and scipy, so the widgets are checked
against exactly that. Any environment with numpy works, for example:

    ~/Documents/myst-sites/lecture-tn23015-computational-science/.venv/bin/python \
        tools/generate-fixtures.py
"""

import json
from pathlib import Path

import numpy as np

OUT = Path(__file__).resolve().parent.parent / "test" / "fixtures" / "numerics.json"


def signal_fixtures():
    rng = np.random.default_rng(20261001)
    fft = {}
    for n in [1, 2, 7, 8, 64, 100, 128]:
        re, im = rng.standard_normal(n), rng.standard_normal(n)
        y = np.fft.fft(re + 1j * im)
        fft[f"n{n}"] = {"re": re.tolist(), "im": im.tolist(),
                        "Yre": y.real.tolist(), "Yim": y.imag.tolist()}
    fftfreq = {f"n{n}_d{d}": {"n": n, "d": d, "f": np.fft.fftfreq(n, d).tolist()}
               for n in [1, 2, 7, 8, 10] for d in [1.0, 0.1]}
    fftshift = {f"n{n}": {"x": list(range(n)), "y": np.fft.fftshift(np.arange(n)).tolist()}
                for n in [1, 2, 7, 8]}
    # A sampled sine: the book's own example (1 Hz, 100 Hz sampling, 10 s) and
    # an aliased one (1.1 Hz at 1 Hz sampling), as |FFT|.
    sine = {}
    for name, f, fs, T in [("book", 1.0, 100.0, 10.0), ("alias", 1.1, 1.0, 10.0)]:
        t = np.arange(round(T * fs)) / fs
        y = np.sin(2 * np.pi * f * t + 0.6)
        sine[name] = {"f": f, "fs": fs, "T": T, "absY": np.abs(np.fft.fft(y)).tolist()}
    return {"fft": fft, "fftfreq": fftfreq, "fftshift": fftshift, "sine": sine}


def diff_fixtures():
    """Forward/backward/centre differences of the book's f(x) = 1 + tanh(2x)/2, in float64 and float32."""
    out = {}
    for dtype in ["float64", "float32"]:
        t = np.dtype(dtype).type
        f = lambda x: t(1) + t(0.5) * np.tanh(t(2) * x)
        rows = []
        for x in [1.0, 0.0, -0.7]:
            for h in np.geomspace(1e-9, 1, 19):
                X, H = t(x), t(h)
                rows.append({
                    "x": x, "h": float(h),
                    "forward": float((f(X + H) - f(X)) / H),
                    "backward": float((f(X) - f(X - H)) / H),
                    "centre": float((f(X + H / t(2)) - f(X - H / t(2))) / H),
                })
        out[dtype] = rows
    return out


def ode_fixtures():
    """Euler/RK2/RK4 on the harmonic oscillator, written out independently in numpy,
    plus a scipy solve_ivp reference for a nonlinear pendulum to check RK4's order."""
    from scipy.integrate import solve_ivp

    def f(y, t):
        return np.array([y[1], -y[0]])

    def euler(y, t, h):
        return y + h * f(y, t)

    def rk2(y, t, h):
        k1 = h * f(y, t)
        return y + h * f(y + k1 / 2, t + h / 2)

    def rk4(y, t, h):
        k1 = f(y, t); k2 = f(y + h / 2 * k1, t + h / 2)
        k3 = f(y + h / 2 * k2, t + h / 2); k4 = f(y + h * k3, t + h)
        return y + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4)

    ho = {}
    for name, step in [("Euler", euler), ("RK2", rk2), ("RK4", rk4)]:
        y, t, h = np.array([0.0, 1.0]), 0.0, 0.1
        traj = [y.tolist()]
        for _ in range(200):
            y = step(y, t, h); t += h
            traj.append(y.tolist())
        ho[name] = traj
    sol = solve_ivp(lambda t, y: [y[1], -np.sin(y[0])], (0, 10), [2.0, 0.0], rtol=1e-12, atol=1e-12)
    return {"ho": ho, "pendulum_y10": sol.y[:, -1].tolist()}


def pde_fixtures():
    """The book's FTCS updates, written directly in numpy, for a few steps from fixed inputs."""
    rng = np.random.default_rng(7)
    u0 = np.r_[0.0, rng.standard_normal(30), 0.0]
    v0 = np.r_[0.0, rng.standard_normal(30), 0.0]
    out = {"u0": u0.tolist(), "v0": v0.tolist()}
    u = u0.copy()
    for _ in range(5):
        u[1:-1] = u[1:-1] + 0.3 * (u[2:] - 2 * u[1:-1] + u[:-2])
    out["diffusion_r0.3_5steps"] = u.tolist()
    u, v = u0.copy(), v0.copy()
    for _ in range(5):
        un, vn = u.copy(), v.copy()
        un[1:-1] = u[1:-1] + v[1:-1]
        vn[1:-1] = v[1:-1] + 0.4**2 * (u[2:] - 2 * u[1:-1] + u[:-2])
        u, v = un, vn
    out["wave_C0.4_5steps"] = {"u": u.tolist(), "v": v.tolist()}
    return out


def quad_fixtures():
    """The book's three rules on its own integral, x^4 - 2x + 1 on [0, 2], checked against scipy for Simpson."""
    from scipy.integrate import simpson as sp_simpson
    f = lambda x: x**4 - 2 * x + 1
    out = {}
    for n in [2, 4, 10, 64]:
        x = np.linspace(0, 2, n + 1); y = f(x); h = x[1] - x[0]
        out[str(n)] = {
            "sum": h * y[:-1].sum(),
            "trap": h * ((y[0] + y[-1]) / 2 + y[1:-1].sum()),
            "simp": h / 3 * (y[0] + y[-1] + 4 * y[1:-1:2].sum() + 2 * y[2:-1:2].sum()),
            "scipy_simp": float(sp_simpson(y, x=x)),
        }
    return out


def roots_fixtures():
    """Bisection midpoints and Newton iterates for the book's Wien equation, written in plain Python."""
    f = lambda x: 5 * np.exp(-x) + x - 5
    fp = lambda x: -5 * np.exp(-x) + 1
    a, b, mids = 2.0, 8.0, []
    fa = f(a)
    for _ in range(30):
        m = 0.5 * (a + b); mids.append(m)
        if fa * f(m) <= 0:
            b = m
        else:
            a, fa = m, f(m)
    xs = [3.0]
    for _ in range(8):
        xs.append(xs[-1] - f(xs[-1]) / fp(xs[-1]))
    from scipy.optimize import brentq
    return {"bisection_mids": mids, "newton": xs, "root": brentq(f, 2, 8, xtol=1e-15)}


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"signal": signal_fixtures(), "diff": diff_fixtures(), "ode": ode_fixtures(), "pde": pde_fixtures(), "quad": quad_fixtures(), "roots": roots_fixtures()}))
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
