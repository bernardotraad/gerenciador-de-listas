import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { SubmitForm } from '@/components/submissoes/submit-form'
import { TopBar } from '@/components/layout/top-bar'
import { Users, LogIn, Send } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface Props {
    searchParams: Promise<{ boate?: string }>
}

function InvalidLink({ message }: { message: string }) {
    return (
        <main className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
            <div className="text-center max-w-sm">
                <p className="text-4xl mb-4">🔗</p>
                <h1 className="text-xl font-bold text-zinc-100">Link inválido</h1>
                <p className="text-zinc-400 text-sm mt-2">{message}</p>
            </div>
        </main>
    )
}

function WelcomeScreen() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
            <div className="text-center max-w-sm">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6 shadow-lg" style={{ backgroundColor: 'var(--cor-tema)' }}>
                    <Users className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-zinc-50 mb-2">Gerenciador de Listas VIP</h1>
                <p className="text-zinc-400 text-sm mb-8">
                    Plataforma de gestão de listas para eventos.
                </p>
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 [background-color:var(--cor-tema)] hover:[background-color:var(--cor-tema-hover)] text-white text-sm font-medium rounded-xl transition-colors"
                >
                    <LogIn className="w-4 h-4" />
                    Entrar como Admin / Portaria
                </Link>
            </div>
        </main>
    )
}

function PublicNavbar({ boateNome }: { boateNome: string }) {
    return (
        <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--cor-tema)' }}>
                        <Users className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-zinc-100 text-sm truncate max-w-[140px]">{boateNome}</span>
                </div>
                <nav className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-sm font-medium px-2.5 py-1.5 rounded-md"
                        style={{ backgroundColor: 'var(--cor-tema-subtle)', color: 'var(--cor-tema)' }}>
                        <Send className="w-3.5 h-3.5 shrink-0" />
                        <span className="hidden sm:inline">Enviar Nomes</span>
                    </span>
                    <Link
                        href="/login"
                        className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100 text-sm px-2.5 py-1.5 rounded-md hover:bg-zinc-800 transition-colors"
                    >
                        <LogIn className="w-3.5 h-3.5 shrink-0" />
                        <span className="hidden sm:inline">Entrar</span>
                    </Link>
                </nav>
            </div>
        </header>
    )
}

export default async function Home({ searchParams }: Props) {
    const { boate: boateId } = await searchParams

    // Sem boate: fluxo de autenticação
    if (!boateId) {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const { data: profile } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role === 'Admin') redirect('/admin/dashboard')
            if (profile?.role === 'Portaria') redirect('/portaria')
            redirect('/login')
        }

        // Unauthenticated: redirecionar para o formulário público
        const svc = createServiceClient()
        const { data: boatePublica } = await svc
            .from('boates')
            .select('id')
            .eq('ativo', true)
            .limit(1)
            .single()
        if (boatePublica) redirect(`/?boate=${boatePublica.id}`)

        return <WelcomeScreen />
    }

    // Com boate: formulário de submissão
    const supabase = createServiceClient()
    const today = format(new Date(), 'yyyy-MM-dd')

    const { data: boate } = await supabase
        .from('boates')
        .select('id, nome, logo_url, cor_tema')
        .eq('id', boateId)
        .eq('ativo', true)
        .single()

    if (!boate) {
        return <InvalidLink message="Boate não encontrada ou inativa." />
    }

    const { data: eventosRaw } = await supabase
        .from('eventos_instancia')
        .select(`
            id, nome, data_efetiva, hora_inicio, hora_fim,
            evento_lista_tipos ( lista_tipos ( id, nome ) )
        `)
        .eq('boate_id', boateId)
        .eq('status', 'Ativo')
        .gte('data_efetiva', today)
        .order('data_efetiva', { ascending: true })

    const eventos = (eventosRaw ?? []).map((evt) => {
        const elt = (evt as any).evento_lista_tipos as Array<{ lista_tipos: { id: string; nome: string } | null }> ?? []
        const listaTipos = elt
            .map((r) => r.lista_tipos)
            .filter((t): t is { id: string; nome: string } => t !== null)

        return {
            id: evt.id,
            nome: evt.nome,
            data_efetiva: evt.data_efetiva,
            hora_inicio: evt.hora_inicio,
            hora_fim: evt.hora_fim,
            listaTipos,
        }
    })

    // Verificar se há usuário logado para mostrar navbar completa
    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()

    let profile: { role: 'Admin' | 'Portaria'; nome: string | null; avatar_url: string | null } | null = null
    if (user) {
        const { data } = await supabaseAuth
            .from('users')
            .select('role, nome, avatar_url')
            .eq('id', user.id)
            .single()
        if (data?.role === 'Admin' || data?.role === 'Portaria') {
            profile = data as { role: 'Admin' | 'Portaria'; nome: string | null; avatar_url: string | null }
        }
    }

    const corTema = boate.cor_tema ?? '#7c3aed'

    const formContent = (
        <div className="w-full max-w-lg">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 shadow-lg" style={{ backgroundColor: corTema }}>
                    <Users className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-zinc-50">{boate.nome}</h1>
                <p className="text-zinc-400 text-sm mt-1">
                    Envie sua lista de convidados
                </p>
            </div>

            {/* Formulário */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                {eventos.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-zinc-400">Nenhum evento ativo no momento.</p>
                        <p className="text-zinc-600 text-sm mt-1">Volte mais tarde.</p>
                    </div>
                ) : (
                    <SubmitForm
                                    boateId={boateId}
                                    eventos={eventos}
                                    initialNome={profile?.nome ?? undefined}
                                    initialEmail={user?.email ?? undefined}
                                    isLoggedIn={!!profile}
                                />
                )}
            </div>

            {!profile && (
                <p className="text-center text-zinc-600 text-xs mt-6">
                    Gerenciador de Listas VIP © {new Date().getFullYear()}
                    {' · '}
                    <Link href="/login" className="hover:text-zinc-400 transition-colors">
                        Acesso Admin / Portaria
                    </Link>
                </p>
            )}
        </div>
    )

    if (profile) {
        return (
            <div
                className="min-h-screen bg-zinc-950"
                style={{ '--cor-tema': corTema } as React.CSSProperties}
            >
                <TopBar
                    boateNome={boate.nome}
                    boateLogoUrl={boate.logo_url ?? null}
                    userName={profile.nome}
                    userAvatarUrl={profile.avatar_url}
                    userRole={profile.role}
                    boateId={boateId}
                />
                <main className="flex flex-col items-center justify-center px-4 pt-20 pb-12">
                    {formContent}
                </main>
            </div>
        )
    }

    return (
        <>
            <PublicNavbar boateNome={boate.nome} />
            <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-12">
                {formContent}
            </main>
        </>
    )
}
