'use client'

import { useState, useTransition } from 'react'
import { criarListaTipo, alternarListaTipo, editarListaTipo, excluirListaTipo, reordenarListaTipos, type ListaTipo } from '@/lib/actions/lista-tipos'
import { Plus, Loader2, Tag, GripVertical, Pencil, Trash2, Check, X } from 'lucide-react'
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableItemProps {
    tipo: ListaTipo
    onToggle: (id: string, ativo: boolean) => void
    onEditar: (id: string, nome: string) => void
    onExcluir: (id: string) => void
    togglingId: string | null
    editandoId: string | null
    excluindoId: string | null
    confirmDeleteId: string | null
    setConfirmDeleteId: (id: string | null) => void
    editNome: string
    setEditNome: (v: string) => void
    setEditandoId: (id: string | null) => void
}

function SortableItem({
    tipo,
    onToggle,
    onEditar,
    onExcluir,
    togglingId,
    editandoId,
    excluindoId,
    confirmDeleteId,
    setConfirmDeleteId,
    editNome,
    setEditNome,
    setEditandoId,
}: SortableItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tipo.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    const isEditing = editandoId === tipo.id
    const isConfirmDelete = confirmDeleteId === tipo.id

    function startEdit() {
        setEditNome(tipo.nome)
        setEditandoId(tipo.id)
    }

    function cancelEdit() {
        setEditandoId(null)
        setEditNome('')
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-opacity ${
                tipo.ativo
                    ? 'glass-card border-white/5'
                    : 'bg-muted/30 border-border/50 opacity-60'
            }`}
        >
            {/* Drag handle */}
            <button
                {...attributes}
                {...listeners}
                className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
                tabIndex={-1}
            >
                <GripVertical className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
                <Tag className="w-3.5 h-3.5 text-primary" />
            </div>

            {/* Nome (inline edit) */}
            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <input
                            autoFocus
                            value={editNome}
                            onChange={(e) => setEditNome(e.target.value)}
                            maxLength={100}
                            className="flex-1 px-2.5 py-1.5 bg-muted/50 border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onEditar(tipo.id, editNome)
                                if (e.key === 'Escape') cancelEdit()
                            }}
                        />
                        <button
                            onClick={() => onEditar(tipo.id, editNome)}
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 rounded-md transition-colors"
                            title="Salvar"
                        >
                            <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={cancelEdit}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                            title="Cancelar"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ) : (
                    <p className="text-sm font-medium text-foreground truncate">{tipo.nome}</p>
                )}
            </div>

            {/* Ações */}
            {!isEditing && (
                <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        tipo.ativo
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-muted/50 text-muted-foreground border-border'
                    }`}>
                        {tipo.ativo ? 'Ativo' : 'Inativo'}
                    </span>

                    <button
                        onClick={() => onToggle(tipo.id, tipo.ativo)}
                        disabled={togglingId === tipo.id}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 px-2 py-1 rounded-md hover:bg-muted/50"
                    >
                        {togglingId === tipo.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : tipo.ativo ? 'Desativar' : 'Ativar'
                        }
                    </button>

                    <button
                        onClick={startEdit}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                        title="Editar"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {isConfirmDelete ? (
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-red-400">Excluir?</span>
                            <button
                                onClick={() => onExcluir(tipo.id)}
                                disabled={excluindoId === tipo.id}
                                className="text-xs text-red-400 hover:text-red-300 px-1.5 py-1 rounded hover:bg-red-400/10 transition-colors disabled:opacity-50"
                            >
                                {excluindoId === tipo.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Sim'}
                            </button>
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-1 rounded hover:bg-muted/50 transition-colors"
                            >
                                Não
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirmDeleteId(tipo.id)}
                            className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                            title="Excluir"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

interface ListaTiposManagerProps {
    tipos: ListaTipo[]
}

export function ListaTiposManager({ tipos: tiposInicial }: ListaTiposManagerProps) {
    const [nome, setNome] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [tipos, setTipos] = useState(tiposInicial)
    const [togglingId, setTogglingId] = useState<string | null>(null)
    const [editandoId, setEditandoId] = useState<string | null>(null)
    const [editNome, setEditNome] = useState('')
    const [excluindoId, setExcluindoId] = useState<string | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [pendingCreate, startCreate] = useTransition()
    const [, startTransition] = useTransition()

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    )

    function handleCriar(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        startCreate(async () => {
            const result = await criarListaTipo(nome)
            if (result.error) {
                setError(result.error)
            } else {
                setNome('')
            }
        })
    }

    async function handleToggle(id: string, ativo: boolean) {
        setTogglingId(id)
        await alternarListaTipo(id, !ativo)
        setTipos((prev) => prev.map((t) => t.id === id ? { ...t, ativo: !ativo } : t))
        setTogglingId(null)
    }

    async function handleEditar(id: string, novoNome: string) {
        const result = await editarListaTipo(id, novoNome)
        if (!result.error) {
            setTipos((prev) => prev.map((t) => t.id === id ? { ...t, nome: novoNome.trim() } : t))
            setEditandoId(null)
            setEditNome('')
        }
    }

    async function handleExcluir(id: string) {
        setExcluindoId(id)
        startTransition(async () => {
            const result = await excluirListaTipo(id)
            if (!result.error) {
                setTipos((prev) => prev.filter((t) => t.id !== id))
                setConfirmDeleteId(null)
            }
            setExcluindoId(null)
        })
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = tipos.findIndex((t) => t.id === active.id)
        const newIndex = tipos.findIndex((t) => t.id === over.id)
        const newTipos = arrayMove(tipos, oldIndex, newIndex).map((t, i) => ({ ...t, ordem: i + 1 }))

        setTipos(newTipos)
        startTransition(async () => {
            await reordenarListaTipos(newTipos.map((t) => ({ id: t.id, ordem: t.ordem })))
        })
    }

    return (
        <div className="space-y-6 max-w-xl">
            {/* Criar novo tipo */}
            <div className="glass-card border-white/5 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">Novo tipo de lista</h2>
                <form onSubmit={handleCriar} className="flex gap-2">
                    <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Ex: Lista Aniversariantes"
                        maxLength={100}
                        className="flex-1 px-3.5 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                    <button
                        type="submit"
                        disabled={pendingCreate || nome.trim().length < 2}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground text-sm font-semibold rounded-lg transition-colors"
                    >
                        {pendingCreate
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Plus className="w-4 h-4" />
                        }
                        Criar
                    </button>
                </form>
                {error && (
                    <p className="text-red-400 text-xs mt-2">{error}</p>
                )}
            </div>

            {/* Lista de tipos com drag-and-drop */}
            <div className="space-y-2">
                {tipos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-16 border border-dashed border-border rounded-xl text-center">
                        <Tag className="w-8 h-8 text-muted-foreground" />
                        <p className="text-muted-foreground text-sm">Nenhum tipo de lista criado ainda</p>
                    </div>
                ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={tipos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                            {tipos.map((tipo) => (
                                <SortableItem
                                    key={tipo.id}
                                    tipo={tipo}
                                    onToggle={handleToggle}
                                    onEditar={handleEditar}
                                    onExcluir={handleExcluir}
                                    togglingId={togglingId}
                                    editandoId={editandoId}
                                    excluindoId={excluindoId}
                                    confirmDeleteId={confirmDeleteId}
                                    setConfirmDeleteId={setConfirmDeleteId}
                                    editNome={editNome}
                                    setEditNome={setEditNome}
                                    setEditandoId={setEditandoId}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div>
    )
}
