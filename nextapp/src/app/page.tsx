import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { SubmitForm } from '@/components/submissoes/submit-form'
import { TopBar } from '@/components/layout/top-bar'
import { Users, LogIn, Send, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { FadeIn, SlideUp, ScaleIn } from '@/components/ui/motion'

interface Props {
    searchParams: Promise<{ boate?: string }>
}

function InvalidLink({ message }: { message: string }) {
    return (
        <main className="min-h-screen flex items-center justify-center bg-transparent px-4">
            <SlideUp className="text-center max-w-sm glass-card p-12 rounded-[2rem]">
                <p className="text-4xl mb-4">🔗</p>
                <h1 className="text-xl font-bold text-foreground">Link inválido</h1>
                <p className="text-muted-foreground text-sm mt-2">{message}</p>
            </SlideUp>
        </main>
    )
}

function WelcomeScreen() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-transparent px-4 relative overflow-hidden">
            {/* Decorative background glow exclusively for welcome screen */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full pointer-events-none -z-10" />

            <div className="w-full max-w-md">
                <SlideUp delay={0.1} className="text-center mb-8">
                    <ScaleIn delay={0.2} className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 shadow-2xl shadow-primary/20 bg-gradient-to-br from-primary to-primary/60 border border-white/20">
                        <Sparkles className="w-10 h-10 text-white" strokeWidth={1.5} />
                    </ScaleIn>
                    <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight">Gerenciador VIP</h1>
                    <p className="text-muted-foreground text-base">
                        Plataforma premium de gestão de listas para eventos exclusivos.
                    </p>
                </SlideUp>

                <SlideUp delay={0.3}>
                    <div className="glass-card rounded-[2rem] p-8 space-y-6">
                        <Link
                            href="/login"
                            className="flex items-center justify-center gap-2 w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold rounded-xl transition-all shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <LogIn className="w-5 h-5" />
                            Acesso Restrito
                        </Link>
                        <p className="text-center text-sm text-muted-foreground">
                            Apenas para administradores e portaria
                        </p>
                    </div>
                </SlideUp>
            </div>
        </main>
    )
}

function PublicNavbar({ boateNome }: { boateNome: string }) {
    return (
        <header className="border-b border-border/40 bg-background/40 backdrop-blur-xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/20 border border-primary/30">
                        <Users className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground text-base truncate max-w-[140px] tracking-tight">{boateNome}</span>
                </div>
                <nav className="flex items-center gap-3">
                    <span className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                        <Send className="w-4 h-4 shrink-0" />
                        <span className="hidden sm:inline">Enviar Nomes</span>
                    </span>
                    <Link
                        href="/login"
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm px-4 py-2 rounded-lg hover:bg-card/50 transition-colors"
                    >
                        <LogIn className="w-4 h-4 shrink-0" />
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
        .select('id, nome, logo_url')
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

    const formContent = (
        <div className="w-full max-w-xl">
            {/* Header */}
            <SlideUp delay={0.1} className="text-center mb-10">
                <ScaleIn delay={0.2} className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] mb-4 shadow-xl">
                    {boate.logo_url ? (
                        <img
                            src={boate.logo_url}
                            alt="Logo"
                            className="w-full h-full object-contain bg-black/20 p-1.5 rounded-[2rem] border border-white/10"
                        />
                    ) : (
                        <div className="w-full h-full bg-primary/20 border border-primary/30 flex items-center justify-center rounded-[2rem] shadow-inner">
                            <Users className="w-10 h-10 text-primary" />
                        </div>
                    )}
                </ScaleIn>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">{boate.nome}</h1>
                <p className="text-muted-foreground text-base mt-2">
                    Envie sua lista de convidados
                </p>
            </SlideUp>

            {/* Formulário */}
            <SlideUp delay={0.2} className="glass-card rounded-[2rem] p-8 sm:p-10 relative overflow-hidden">
                {/* Subtle highlight effect inside card */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                {eventos.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                            <Sparkles className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-foreground text-lg font-medium">Nenhum evento ativo no momento</p>
                        <p className="text-muted-foreground mt-2">Fique de olho, em breve teremos novidades.</p>
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
            </SlideUp>

            {!profile && (
                <FadeIn delay={0.4}>
                    <p className="text-center text-muted-foreground text-sm mt-8">
                        Gerenciador VIP © {new Date().getFullYear()}
                        {' · '}
                        <Link href="/login" className="hover:text-foreground hover:underline transition-colors decoration-primary/50 underline-offset-4">
                            Acesso Restrito
                        </Link>
                    </p>
                </FadeIn>
            )}
        </div>
    )

    if (profile) {
        return (
            <div className="min-h-screen bg-transparent">
                <TopBar
                    boateNome={boate.nome}
                    boateLogoUrl={boate.logo_url ?? null}
                    userName={profile.nome}
                    userAvatarUrl={profile.avatar_url}
                    userRole={profile.role}
                    boateId={boateId}
                />
                <main className="flex flex-col items-center justify-center px-4 pt-24 pb-16">
                    {formContent}
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            <PublicNavbar boateNome={boate.nome} />
            <main className="min-h-screen bg-transparent flex flex-col items-center justify-center px-4 py-16">
                {formContent}
            </main>
        </div>
    )
}
