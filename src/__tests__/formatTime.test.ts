import { formatTimeRemaining } from '@/utils/formatTime';

describe('formatTimeRemaining', () => {
  it('formats zero seconds', () => {
    expect(formatTimeRemaining(0)).toBe('0:00');
  });

  it('formats seconds only', () => {
    expect(formatTimeRemaining(45)).toBe('0:45');
  });

  it('formats minutes and seconds', () => {
    expect(formatTimeRemaining(125)).toBe('2:05');
  });

  it('formats hours, minutes, and seconds', () => {
    expect(formatTimeRemaining(3661)).toBe('1:01:01');
  });

  it('pads minutes and seconds with zeros when hours present', () => {
    expect(formatTimeRemaining(3600)).toBe('1:00:00');
  });

  it('formats large durations', () => {
    expect(formatTimeRemaining(28800)).toBe('8:00:00');
  });

  it('pads single-digit seconds', () => {
    expect(formatTimeRemaining(63)).toBe('1:03');
  });
});
