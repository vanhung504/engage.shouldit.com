import { cookies } from 'next/headers'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

function LoginPage({ error }: { error?: boolean }) {
  return (
    <div className={`${inter.variable} font-(family-name:--font-inter) flex items-center justify-center min-h-screen bg-gray-50 text-gray-900`}>
      <div className="bg-white border border-gray-200 rounded-xl p-8 w-80 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-lg font-bold tracking-tight">shouldit</span>
          <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded">engage</span>
        </div>
        {error && <p className="text-red-500 text-sm mb-3">Wrong password</p>}
        <form method="POST" action="/api/admin/login" className="space-y-3">
          <input
            name="password"
            type="password"
            placeholder="Admin password"
            required
            autoFocus
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <button
            type="submit"
            className="w-full py-2 bg-gray-900 text-white rounded-lg font-semibold text-sm hover:bg-black transition-colors cursor-pointer"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}

export default async function AdminLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode
  searchParams?: Promise<{ error?: string }>
}) {
  const jar   = await cookies()
  const token = jar.get('admin_token')?.value

  if (!token || token !== process.env.ADMIN_SECRET) {
    const sp = await searchParams
    return <LoginPage error={sp?.error === '1'} />
  }

  return (
    <div className={`${inter.variable} font-(family-name:--font-inter) flex min-h-screen bg-gray-50 text-gray-900`}>
      {/* Sidebar */}
      <aside className="w-52 shrink-0 bg-gray-900 flex flex-col text-sm">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-800">
          <span className="text-white font-bold tracking-tight">shouldit</span>
          <span className="ml-2 text-xs font-medium bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">engage</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <a
            href="/admin"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-colors no-underline"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h8" />
            </svg>
            Placements
          </a>
          <a
            href="/admin/products"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-colors no-underline"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM12 12a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            Products
          </a>
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-gray-800">
          <form method="POST" action="/api/admin/logout">
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors cursor-pointer bg-transparent border-none text-sm text-left"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 p-8">
        {children}
      </main>
    </div>
  )
}
