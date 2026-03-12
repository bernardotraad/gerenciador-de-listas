import { redirect } from 'next/navigation'
import { getMeuPerfil } from '@/lib/actions/perfil'
import { PerfilForm } from '@/components/perfil/perfil-form'

export default async function PerfilPage() {
    const { data: perfil, error } = await getMeuPerfil()

    if (error || !perfil) {
        redirect('/login')
    }

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
                <p className="text-muted-foreground text-sm mt-1">Gerencie suas informações pessoais</p>
            </div>
            <PerfilForm perfil={perfil} />
        </>
    )
}
