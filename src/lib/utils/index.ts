export * from './price'

export function normalizeCategory(category: string): string {
	return category.toLowerCase().replace(/\s+/g, '-')
}
