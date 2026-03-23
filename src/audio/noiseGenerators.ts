import type { NoiseColor } from '@/types';

function normalize(data: Float32Array): void {
  let max = 0;
  for (let i = 0; i < data.length; i++) {
    const abs = Math.abs(data[i]);
    if (abs > max) max = abs;
  }
  if (max > 0) {
    for (let i = 0; i < data.length; i++) {
      data[i] /= max;
    }
  }
}

function fillWhiteNoise(data: Float32Array): void {
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
}

/**
 * Paul Kellet's refined pink noise filter (±0.5dB accuracy).
 * Applies 6 cascaded first-order filter states to white noise,
 * producing a −3dB/octave spectral slope.
 */
function fillPinkNoise(data: Float32Array): void {
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;

  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
}

/**
 * Brown (Brownian/red) noise via leaky integrator.
 * Produces a −6dB/octave spectral slope.
 * The leak factor (0.99) prevents DC drift.
 */
function fillBrownNoise(data: Float32Array): void {
  let brown = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    brown = brown * 0.99 + white * 0.02;
    data[i] = brown;
  }
  normalize(data);
}

/**
 * Blue noise via first-order differentiation of white noise.
 * Produces a +3dB/octave spectral slope.
 */
function fillBlueNoise(data: Float32Array): void {
  let prev = Math.random() * 2 - 1;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = white - prev;
    prev = white;
  }
  normalize(data);
}

export function fillNoiseBuffer(data: Float32Array, color: NoiseColor): void {
  switch (color) {
    case 'white':
    case 'custom':
      fillWhiteNoise(data);
      break;
    case 'pink':
      fillPinkNoise(data);
      break;
    case 'brown':
      fillBrownNoise(data);
      break;
    case 'blue':
      fillBlueNoise(data);
      break;
  }
}
