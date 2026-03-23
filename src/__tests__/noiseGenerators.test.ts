import {
  fillNoiseBuffer,
  fillBlendedNoiseBuffer,
} from '@/audio/noiseGenerators';

const BUFFER_SIZE = 4096;

function createBuffer(): Float32Array {
  return new Float32Array(BUFFER_SIZE);
}

function mean(data: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i];
  return sum / data.length;
}

function rms(data: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
  return Math.sqrt(sum / data.length);
}

describe('fillNoiseBuffer', () => {
  it('fills buffer with white noise (values in [-1, 1])', () => {
    const data = createBuffer();
    fillNoiseBuffer(data, 'white');

    for (let i = 0; i < data.length; i++) {
      expect(data[i]).toBeGreaterThanOrEqual(-1);
      expect(data[i]).toBeLessThanOrEqual(1);
    }
  });

  it('white noise has near-zero mean', () => {
    const data = createBuffer();
    fillNoiseBuffer(data, 'white');
    expect(Math.abs(mean(data))).toBeLessThan(0.1);
  });

  it('white noise has non-trivial RMS energy', () => {
    const data = createBuffer();
    fillNoiseBuffer(data, 'white');
    expect(rms(data)).toBeGreaterThan(0.3);
  });

  it('fills buffer with pink noise', () => {
    const data = createBuffer();
    fillNoiseBuffer(data, 'pink');
    expect(rms(data)).toBeGreaterThan(0);
  });

  it('fills buffer with brown noise (normalized to [-1, 1])', () => {
    const data = createBuffer();
    fillNoiseBuffer(data, 'brown');

    let max = 0;
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > max) max = abs;
    }
    // Brown noise is normalized, so peak should be ~1
    expect(max).toBeCloseTo(1, 1);
  });

  it('fills buffer with blue noise (normalized to [-1, 1])', () => {
    const data = createBuffer();
    fillNoiseBuffer(data, 'blue');

    let max = 0;
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > max) max = abs;
    }
    expect(max).toBeCloseTo(1, 1);
  });

  it('custom color falls back to white noise', () => {
    const data = createBuffer();
    fillNoiseBuffer(data, 'custom');
    // Should produce the same kind of output as white noise (non-zero energy)
    expect(rms(data)).toBeGreaterThan(0.3);
  });

  it('produces different output on each call (not deterministic)', () => {
    const data1 = createBuffer();
    const data2 = createBuffer();
    fillNoiseBuffer(data1, 'white');
    fillNoiseBuffer(data2, 'white');

    let identical = true;
    for (let i = 0; i < data1.length; i++) {
      if (data1[i] !== data2[i]) {
        identical = false;
        break;
      }
    }
    expect(identical).toBe(false);
  });
});

describe('fillBlendedNoiseBuffer', () => {
  it('position 0 produces brown-like noise', () => {
    const data = createBuffer();
    fillBlendedNoiseBuffer(data, 0);
    expect(rms(data)).toBeGreaterThan(0);
  });

  it('position 1 produces blue-like noise', () => {
    const data = createBuffer();
    fillBlendedNoiseBuffer(data, 1);
    expect(rms(data)).toBeGreaterThan(0);
  });

  it('position 0.5 blends pink and white', () => {
    const data = createBuffer();
    fillBlendedNoiseBuffer(data, 0.5);
    expect(rms(data)).toBeGreaterThan(0);
  });

  it('clamps out-of-range positions', () => {
    const dataLow = createBuffer();
    const dataHigh = createBuffer();

    // Should not throw
    fillBlendedNoiseBuffer(dataLow, -1);
    fillBlendedNoiseBuffer(dataHigh, 2);

    expect(rms(dataLow)).toBeGreaterThan(0);
    expect(rms(dataHigh)).toBeGreaterThan(0);
  });

  it('exact stop positions produce unblended noise', () => {
    const data = createBuffer();
    // Position 0.33 is exactly pink
    fillBlendedNoiseBuffer(data, 0.33);
    expect(rms(data)).toBeGreaterThan(0);
  });
});
