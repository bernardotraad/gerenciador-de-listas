import { listarListaTipos } from '@/lib/actions/lista-tipos'
import { ListaTiposManager } from '@/components/lista-tipos/lista-tipos-manager'
import { Tags } from 'lucide-react'

export default async function ListaTiposPage() {
    const { data: tipos, error } = await listarListaTipos()

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--cor-tema-subtle)' }}>
                    <Tags className="w-5 h-5" style={{ color: 'var(--cor-tema)' }} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-50">Tipos de Lista</h1>
                    <p className="text-zinc-400 text-sm mt-0.5">
                        Gerencie os tipos de lista disponíveis para seus eventos
                    </p>
                </div>
            </div>

            {error ? (
                <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                    {error}
                </div>
            ) : (
                <ListaTiposManager tipos={tipos ?? []} />
            )}
        </div>
    )
}
