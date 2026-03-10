import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/top-bar'

export default async function PortariaLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('users')
        .select('role, nome, boate_id, avatar_url')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'Portaria' && profile?.role !== 'Admin') redirect('/login')

    const isAdmin = profile?.role === 'Admin'

    const { data: boate } = await supabase
        .from('boates')
        .select('id, nome, logo_url, cor_tema')
        .eq('id', profile.boate_id)
        .single()

    const corTema = boate?.cor_tema ?? '#7c3aed'

    if (isAdmin) {
        const { count: submissoesPendentes } = await supabase
            .from('guest_submissions')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'Pendente')

        return (
            <div
                className="min-h-screen [background-color:var(--cor-tema-fundo)]"
                style={{ '--cor-tema': corTema } as React.CSSProperties}
            >
                <TopBar
                    boateNome={boate?.nome ?? undefined}
                    boateLogoUrl={boate?.logo_url ?? null}
                    userName={profile?.nome}
                    userAvatarUrl={profile?.avatar_url ?? null}
                    userRole="Admin"
                    boateId={boate?.id ?? undefined}
                    submissoesPendentes={submissoesPendentes ?? 0}
                />
                <main className="max-w-3xl mx-auto px-4 pt-16 pb-8">
                    {children}
                </main>
            </div>
        )
    }

    return (
        <div
            className="min-h-screen [background-color:var(--cor-tema-fundo)]"
            style={{ '--cor-tema': corTema } as React.CSSProperties}
        >
            <TopBar
                boateNome={boate?.nome ?? undefined}
                boateLogoUrl={boate?.logo_url ?? null}
                userName={profile?.nome}
                userAvatarUrl={profile?.avatar_url ?? null}
                userRole="Portaria"
                boateId={boate?.id ?? undefined}
            />
            <main className="max-w-3xl mx-auto px-4 pt-16 pb-8">
                {children}
            </main>
        </div>
    )
}
