const COOLDOWN_DAYS = 30;

export function canRequestHwidReset(lastRequestAt?: string | null) {
  if (!lastRequestAt) return { allowed: true, cooldownMs: 0 };
  const elapsed = Date.now() - new Date(lastRequestAt).getTime();
  const cooldown = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  if (elapsed >= cooldown) return { allowed: true, cooldownMs: 0 };
  return { allowed: false, cooldownMs: cooldown - elapsed };
}

export function maskHwid(hwid: string | null) {
  if (!hwid) return 'Unbound';
  return hwid.replace(/.(?=.{4})/g, '*');
}

export function bindHwid(current: string | null, incoming: string) {
  if (!current) return { ok: true, next: incoming, reason: 'BOUND_FIRST_TIME' };
  if (current === incoming) return { ok: true, next: current, reason: 'UNCHANGED' };
  return { ok: false, next: current, reason: 'HWID_MISMATCH_RESET_REQUIRED' };
}
