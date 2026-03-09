import { redirect } from 'next/navigation'

interface Props {
    searchParams: Promise<{ boate?: string }>
}

export default async function SubmitRedirect({ searchParams }: Props) {
    const { boate } = await searchParams
    redirect(boate ? `/?boate=${boate}` : '/')
}
