export * from './price'

export function normalizeCategory(category: string): string {
	return category.toLowerCase().replace(/\s+/g, '-')
}

export function applyVars(template: string, vars: Record<string, string>): string {
	const resolve = (s: string) => s.replace(/\{\{(\w+)\}\}/g, (match, key) => vars[key] ?? match)
	return resolve(resolve(template))
}
