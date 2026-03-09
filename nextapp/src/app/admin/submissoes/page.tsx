import { createClient } from '@/lib/supabase/server'
import { SubmissoesTabs } from '@/components/submissoes/submissoes-tabs'
import { InboxIcon } from 'lucide-react'

type SubStatus = 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Rascunho'

export default async function SubmissoesPage() {
    const supabase = await createClient()

    const { data: submissoes } = await supabase
        .from('guest_submissions')
        .select(`
            id, submitter_label, raw_text, parsed_names, status,
            approval_notes, created_at,
            eventos_instancia ( nome, data_efetiva ),
            lista_tipos ( nome )
        `)
        .order('created_at', { ascending: false })

    const total = submissoes?.length ?? 0

    const flatSubmissoes = (submissoes ?? []).map((sub) => ({
        id: sub.id,
        eventoNome: (sub.eventos_instancia as unknown as { nome: string; data_efetiva: string } | null)?.nome ?? '—',
        dataEfetiva: (sub.eventos_instancia as unknown as { nome: string; data_efetiva: string } | null)?.data_efetiva ?? '',
        listaTipoNome: (sub.lista_tipos as unknown as { nome: string } | null)?.nome ?? null,
        submitterLabel: sub.submitter_label,
        parsedNames: (sub.parsed_names as string[]) ?? [],
        status: sub.status as SubStatus,
        approvalNotes: sub.approval_notes,
        createdAt: sub.created_at ?? '',
    }))

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-zinc-50">Submissões</h1>
                <p className="text-zinc-400 text-sm mt-1">{total} total</p>
            </div>

            {/* Lista */}
            {total === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24 border border-dashed border-zinc-800 rounded-2xl text-center">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center">
                        <InboxIcon className="w-6 h-6 text-zinc-500" />
                    </div>
                    <div>
                        <p className="text-zinc-300 font-medium">Nenhuma submissão ainda</p>
                        <p className="text-zinc-500 text-sm mt-1">
                            Compartilhe o link de submissão para receber listas.
                        </p>
                    </div>
                </div>
            ) : (
                <SubmissoesTabs submissoes={flatSubmissoes} />
            )}
        </div>
    )
}
