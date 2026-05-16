const KEYS = {
  subscribed:   'si_subscribed',
  email:        'si_email',
  subscriberId: 'si_sid',
  gates:        'si_gates',
  exitShown:    'si_exit_shown',
} as const

export function isSubscribed(): boolean {
  return localStorage.getItem(KEYS.subscribed) === 'true'
}

export function getEmail(): string | null {
  return localStorage.getItem(KEYS.email)
}

export function getSubscriberId(): string | null {
  return localStorage.getItem(KEYS.subscriberId)
}

export function saveSubscriber(email: string, subscriberId: string): void {
  localStorage.setItem(KEYS.subscribed, 'true')
  localStorage.setItem(KEYS.email, email)
  localStorage.setItem(KEYS.subscriberId, subscriberId)
}

export function getUnlockedGates(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.gates) ?? '[]')
  } catch {
    return []
  }
}

export function unlockGate(gateId: string): void {
  const gates = getUnlockedGates()
  if (!gates.includes(gateId)) {
    localStorage.setItem(KEYS.gates, JSON.stringify([...gates, gateId]))
  }
}

export function isGateUnlocked(gateId: string): boolean {
  return getUnlockedGates().includes(gateId)
}

export function wasExitShown(): boolean {
  return sessionStorage.getItem(KEYS.exitShown) === 'true'
}

export function markExitShown(): void {
  sessionStorage.setItem(KEYS.exitShown, 'true')
}
