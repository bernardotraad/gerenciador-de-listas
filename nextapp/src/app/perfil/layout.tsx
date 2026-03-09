import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/top-bar'

export default async function PerfilLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('users')
        .select('role, nome, boate_id, avatar_url')
        .eq('id', user.id)
        .single()

    if (!profile) redirect('/login')

    const { data: boate } = await supabase
        .from('boates')
        .select('id, nome, logo_url, cor_tema')
        .eq('id', profile.boate_id)
        .single()

    const corTema = boate?.cor_tema ?? '#7c3aed'
    const role = (profile.role === 'Admin' ? 'Admin' : 'Portaria') as 'Admin' | 'Portaria'

    return (
        <div
            className="min-h-screen bg-zinc-950"
            style={{ '--cor-tema': corTema } as React.CSSProperties}
        >
            <TopBar
                boateNome={boate?.nome ?? undefined}
                boateLogoUrl={boate?.logo_url ?? null}
                userName={profile.nome}
                userRole={role}
            />
            <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-16 pb-8">
                {children}
            </main>
        </div>
    )
}
