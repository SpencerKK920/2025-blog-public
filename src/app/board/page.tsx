'use client'

import { useBlogIndex } from '@/hooks/use-blog-index'
import { motion } from 'motion/react'

export default function BoardPage() {
    const { blogIndex, loading } = useBlogIndex()
    const featuredPost = blogIndex?.[0] // 识别到的第一篇文章

    return (
        <div className="flex flex-col items-center px-6 pt-32 pb-12 min-h-screen">
            <h1 className="font-averia text-4xl font-bold uppercase italic">Studio Board</h1>
            <div className="bg-brand h-1 w-12 mt-2 mb-16 rounded-full" />
            
            {loading ? <p>Loading...</p> : (
                featuredPost && (
                    <div className="w-full max-w-[1200px] p-8 bg-card border squircle">
                         {/* 这里显示文章内容 */}
                         <h2 className="text-3xl font-bold">{featuredPost.title}</h2>
                         <p className="mt-4 text-secondary">{featuredPost.description}</p>
                    </div>
                )
            )}
        </div>
    )
}
