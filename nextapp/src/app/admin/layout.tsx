import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/top-bar'

export default async function AdminLayout({
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

    if (profile?.role !== 'Admin') redirect('/login')

    const { data: boate } = await supabase
        .from('boates')
        .select('id, nome, logo_url')
        .eq('id', profile.boate_id)
        .single()

    const { count: submissoesPendentes } = await supabase
        .from('guest_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'Pendente')

    return (
        <div className="min-h-screen bg-background">
            <TopBar
                boateNome={boate?.nome ?? undefined}
                boateLogoUrl={boate?.logo_url ?? null}
                userName={profile?.nome}
                userAvatarUrl={profile?.avatar_url ?? null}
                userRole="Admin"
                boateId={boate?.id ?? undefined}
                submissoesPendentes={submissoesPendentes ?? 0}
            />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
                {children}
            </main>
        </div>
    )
}
