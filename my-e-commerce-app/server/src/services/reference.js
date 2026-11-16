import { randomBytes } from 'node:crypto';

/**
 * Human-readable, unique order references (prd/agent.md section 11).
 * Format: IDB-YYYYMMDD-XXXXXX (UTC date plus 6 random hex characters).
 * Randomness comes from node:crypto, not Math.random, so references are not
 * guessable in sequence.
 */
export function generateOrderReference(now = new Date(), bytes = randomBytes) {
  const date = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
  ].join('');

  const suffix = bytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `IDB-${date}-${suffix}`;
}

export default generateOrderReference;
