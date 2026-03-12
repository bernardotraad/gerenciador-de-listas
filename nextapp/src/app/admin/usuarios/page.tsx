import { createClient } from '@/lib/supabase/server'
import { listarUsuarios } from '@/lib/actions/usuarios'
import { UsuariosManager } from '@/components/usuarios/usuarios-manager'
import { UsersRound } from 'lucide-react'

export default async function UsuariosPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: usuarios, error } = await listarUsuarios()

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/20">
                    <UsersRound className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Gerencie os usuários com acesso ao sistema
                    </p>
                </div>
            </div>

            {error ? (
                <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                    {error}
                </div>
            ) : (
                <UsuariosManager
                    usuarios={usuarios ?? []}
                    currentUserId={user!.id}
                />
            )}
        </div>
    )
}
