import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rotas que não precisam de autenticação
const PUBLIC_PATHS = [
    '/submit',
    '/api/auth',
    '/api/bootstrap',
    '/login',
    '/_next',
    '/favicon.ico',
]

function isPublic(pathname: string) {
    if (pathname === '/') return true
    return PUBLIC_PATHS.some((p) => pathname.startsWith(p))
}

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return request.cookies.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Atualiza a sessão (obrigatório para @supabase/ssr)
    const { data: { user } } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // Rota pública → passa direto
    if (isPublic(pathname)) return supabaseResponse

    // Não autenticado → login
    if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return supabaseResponse
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
