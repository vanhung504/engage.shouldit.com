import { db } from '@/db'
import { categories } from '@/db/schema'
import { ProductsList } from '../components/ProductsList'
import { NewCategoryModal } from '../components/NewCategoryModal'

type SearchParams = {
  category?: string
  newcat?:   string
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp      = await searchParams
  const catSlug = sp.category
  const newcat  = sp.newcat === '1'

  const allCategories = await db.select().from(categories).orderBy(categories.createdAt)
  const activeCat = allCategories.find(c => c.slug === catSlug) ?? allCategories[0]

  return (
    <div className='max-w-7xl'>
      <h1 className="text-xl font-bold text-gray-900 mb-5">Products</h1>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {allCategories.map(cat => (
          <a
            key={cat.id}
            href={`/admin/products?category=${cat.slug}`}
            className={`px-4 py-1.5 rounded-full text-sm no-underline transition-colors ${
              activeCat?.slug === cat.slug
                ? 'bg-black text-white font-semibold'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {cat.name}
          </a>
        ))}
        <a
          href="/admin/products?newcat=1"
          className="px-4 py-1.5 rounded-full text-sm border border-dashed border-gray-400 text-gray-500 no-underline hover:border-gray-600 hover:text-gray-700 transition-colors"
        >
          + New category
        </a>
      </div>

      {newcat && <NewCategoryModal redirectTo="/admin/products" />}

      {!activeCat ? (
        <p className="text-gray-500">No categories yet. Create one above.</p>
      ) : (
        <ProductsList categoryId={activeCat.id} categorySlug={activeCat.slug} />
      )}
    </div>
  )
}
