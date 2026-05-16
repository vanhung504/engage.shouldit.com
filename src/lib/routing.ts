export function determineSequence(tags: Record<string, string>): string {
  if (tags.intent === 'deal') return 'deal_hunter'
  if (tags.intent === 'data') return 'power_user'

  const cat    = tags.category ?? 'general'
  const suffix = tags.intent === 'buying' ? 'buying' : 'research'
  return `${cat}_${suffix}`
}
