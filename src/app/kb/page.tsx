'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function KbPage() {
    const router = useRouter()

    useEffect(() => {
        router.replace('/board')
    }, [router])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <div className="w-8 h-8 border-2 border-brand/30 border-t-brand animate-spin rounded-full" />
            <p className="text-sm text-secondary">知识库已合并到看板，正在跳转...</p>
        </div>
    )
}
