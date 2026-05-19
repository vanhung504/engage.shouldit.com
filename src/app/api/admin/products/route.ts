import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { products, categories } from '@/db/schema'
import { isAdminAuthorized, unauthorized } from '@/app/api/admin/middleware'
import { createId } from '@paralleldrive/cuid2'

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) return unauthorized()

  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get('categoryId')

  const rows = categoryId
    ? await db.select().from(products).where(eq(products.categoryId, categoryId))
    : await db.select().from(products)

  return Response.json(rows)
}

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) return unauthorized()

  const { productId, categorySlug, name, meta = {} } = await request.json()
  if (!productId || !categorySlug || !name) {
    return Response.json({ error: 'productId, categorySlug and name are required' }, { status: 400 })
  }

  const [cat] = await db.select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, categorySlug))
    .limit(1)

  if (!cat) return Response.json({ error: 'Category not found' }, { status: 404 })

  const [row] = await db.insert(products)
    .values({ id: createId(), productId, categoryId: cat.id, name, meta })
    .returning()

  return Response.json(row, { status: 201 })
}
