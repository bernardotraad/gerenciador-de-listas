'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { atualizarLogoUrl } from '@/lib/actions/boate'
import { Upload, Loader2, ImageIcon } from 'lucide-react'

interface Props {
    boateId: string
    currentLogoUrl: string | null
}

export function LogoUploader({ boateId, currentLogoUrl }: Props) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [preview, setPreview] = useState<string | null>(currentLogoUrl)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            setError('Selecione uma imagem (PNG, JPG, WebP)')
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            setError('Imagem deve ter no máximo 2MB')
            return
        }

        setError(null)
        setUploading(true)

        try {
            const ext = file.name.split('.').pop() ?? 'png'
            const path = `${boateId}/logo.${ext}`

            const supabase = createClient()
            const { error: uploadError } = await supabase.storage
                .from('boate-assets')
                .upload(path, file, { upsert: true })

            if (uploadError) throw new Error(uploadError.message)

            const { data: { publicUrl } } = supabase.storage
                .from('boate-assets')
                .getPublicUrl(path)

            const result = await atualizarLogoUrl(publicUrl)
            if (result.error) throw new Error(result.error)

            setPreview(publicUrl + `?t=${Date.now()}`)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao fazer upload')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-3">
            <label className="text-xs font-medium text-zinc-400">Logo da Boate</label>

            <div className="flex items-center gap-4">
                {/* Preview */}
                <div className="w-16 h-16 rounded-xl border border-zinc-700 bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                    {preview ? (
                        <img
                            src={preview}
                            alt="Logo"
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <ImageIcon className="w-6 h-6 text-zinc-600" />
                    )}
                </div>

                {/* Upload button */}
                <div className="space-y-1.5">
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Upload className="w-4 h-4" />
                        }
                        {uploading ? 'Enviando...' : 'Alterar logo'}
                    </button>
                    <p className="text-xs text-zinc-600">PNG, JPG ou WebP · máx. 2MB</p>
                </div>
            </div>

            {error && (
                <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                    {error}
                </p>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    )
}
