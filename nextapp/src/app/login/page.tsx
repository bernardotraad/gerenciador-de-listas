import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from './login-form'

export default async function LoginPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()

        if (profile?.role === 'Admin') redirect('/admin/dashboard')
        if (profile?.role === 'Portaria') redirect('/portaria')
    }

    return <LoginForm />
}
