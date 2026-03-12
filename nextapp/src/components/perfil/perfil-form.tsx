'use client'

import { useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { editarMeuPerfil, atualizarMeuAvatar, alterarMinhaSenha, type MeuPerfil } from '@/lib/actions/perfil'
import { Upload, Loader2, UserCircle, Save, KeyRound } from 'lucide-react'

const ROLE_BADGE: Record<string, string> = {
    Admin: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    Portaria: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    Viewer: 'bg-muted/50 text-muted-foreground border-border',
}

interface Props {
    perfil: MeuPerfil
}

export function PerfilForm({ perfil }: Props) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [nome, setNome] = useState(perfil.nome)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(perfil.avatar_url)
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [pending, startTransition] = useTransition()
    const [senhaAtual, setSenhaAtual] = useState('')
    const [novaSenha, setNovaSenha] = useState('')
    const [senhaError, setSenhaError] = useState<string | null>(null)
    const [senhaSuccess, setSenhaSuccess] = useState(false)
    const [pendingSenha, startTransitionSenha] = useTransition()

    async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            setUploadError('Selecione uma imagem (PNG, JPG, WebP)')
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            setUploadError('Imagem deve ter no máximo 2MB')
            return
        }

        setUploadError(null)
        setUploading(true)

        try {
            const ext = file.name.split('.').pop() ?? 'png'
            const path = `${perfil.id}/avatar.${ext}`

            const supabase = createClient()
            const { error: uploadError } = await supabase.storage
                .from('user-avatars')
                .upload(path, file, { upsert: true })

            if (uploadError) throw new Error(uploadError.message)

            const { data: { publicUrl } } = supabase.storage
                .from('user-avatars')
                .getPublicUrl(path)

            const result = await atualizarMeuAvatar(publicUrl)
            if (result.error) throw new Error(result.error)

            setAvatarPreview(publicUrl + `?t=${Date.now()}`)
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : 'Erro ao fazer upload')
        } finally {
            setUploading(false)
        }
    }

    function handleSalvar(e: React.FormEvent) {
        e.preventDefault()
        setSaveError(null)
        setSaveSuccess(false)
        startTransition(async () => {
            const result = await editarMeuPerfil(nome)
            if (result.error) {
                setSaveError(result.error)
            } else {
                setSaveSuccess(true)
                setTimeout(() => setSaveSuccess(false), 3000)
            }
        })
    }

    function handleAlterarSenha(e: React.FormEvent) {
        e.preventDefault()
        setSenhaError(null)
        setSenhaSuccess(false)
        startTransitionSenha(async () => {
            const result = await alterarMinhaSenha(senhaAtual, novaSenha)
            if (result.error) {
                setSenhaError(result.error)
            } else {
                setSenhaSuccess(true)
                setSenhaAtual('')
                setNovaSenha('')
                setTimeout(() => setSenhaSuccess(false), 3000)
            }
        })
    }

    return (
        <div className="space-y-6 max-w-lg">
            {/* Avatar */}
            <div className="glass-card border-white/5 rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-foreground">Foto de Perfil</h2>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border border-border bg-muted/50 flex items-center justify-center overflow-hidden shrink-0">
                        {avatarPreview ? (
                            <img
                                src={avatarPreview}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <UserCircle className="w-10 h-10 text-muted-foreground" />
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            disabled={uploading}
                            className="flex items-center gap-2 px-3.5 py-2 glass-card hover:bg-muted/50 border border-white/5 text-foreground text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {uploading ? 'Enviando...' : 'Alterar foto'}
                        </button>
                        <p className="text-xs text-muted-foreground">PNG, JPG ou WebP · máx. 2MB</p>
                    </div>
                </div>
                {uploadError && (
                    <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                        {uploadError}
                    </p>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                />
            </div>

            {/* Alterar senha */}
            <div className="glass-card border-white/5 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-foreground mb-4">Alterar Senha</h2>
                <form onSubmit={handleAlterarSenha} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Senha atual</label>
                        <input
                            type="password"
                            value={senhaAtual}
                            onChange={(e) => setSenhaAtual(e.target.value)}
                            placeholder="Sua senha atual"
                            minLength={6}
                            required
                            className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nova senha</label>
                        <input
                            type="password"
                            value={novaSenha}
                            onChange={(e) => setNovaSenha(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            minLength={6}
                            required
                            className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                    </div>

                    {senhaError && (
                        <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                            {senhaError}
                        </p>
                    )}

                    {senhaSuccess && (
                        <p className="text-emerald-400 text-xs bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2">
                            Senha alterada com sucesso!
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={pendingSenha || senhaAtual.length < 6 || novaSenha.length < 6}
                        className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-foreground text-sm font-semibold rounded-lg transition-colors border border-border"
                    >
                        {pendingSenha ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                        Alterar senha
                    </button>
                </form>
            </div>

            {/* Dados pessoais */}
            <div className="glass-card border-white/5 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-foreground mb-4">Dados Pessoais</h2>
                <form onSubmit={handleSalvar} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nome</label>
                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            minLength={2}
                            maxLength={100}
                            required
                            className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
                        <input
                            type="email"
                            value={perfil.email}
                            readOnly
                            className="w-full px-3.5 py-2.5 bg-muted/30 border border-border/50 rounded-lg text-muted-foreground text-sm cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Função</label>
                        <div>
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${ROLE_BADGE[perfil.role] ?? ROLE_BADGE.Viewer}`}>
                                {perfil.role}
                            </span>
                        </div>
                    </div>

                    {saveError && (
                        <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                            {saveError}
                        </p>
                    )}

                    {saveSuccess && (
                        <p className="text-emerald-400 text-xs bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2">
                            Perfil atualizado com sucesso!
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={pending || nome.trim().length < 2}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground text-sm font-semibold rounded-lg transition-colors"
                    >
                        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar alterações
                    </button>
                </form>
            </div>
        </div>
    )
}
