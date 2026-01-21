'use client'

import { useBlogIndex } from '@/hooks/use-blog-index'
import { motion } from 'motion/react'
import { BoardCard } from './board-card'

export default function BoardPage() {
    const { items, loading } = useBlogIndex()

    return (
        <div className="flex flex-col items-center px-6 pt-32 pb-12 min-h-screen">
            {/* 页面标题 */}
            <div className='mb-12 text-center'>
                <h1 className='font-averia text-4xl font-bold tracking-tight uppercase tracking-widest italic'>
                    Studio Board
                </h1>
                <div className='bg-brand mt-2 h-1 w-12 mx-auto rounded-full' />
            </div>

            {loading ? (
                <div className="flex flex-col items-center gap-4 mt-20">
                    <div className="w-8 h-8 border-2 border-brand/30 border-t-brand animate-spin rounded-full" />
                    <p className="text-[10px] font-mono text-brand uppercase tracking-widest">Loading...</p>
                </div>
            ) : (
                /* 核心：使用 Grid 布局显示所有文章 */
                <div className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-2 gap-6">
                    {items && items.length > 0 ? (
                        items.map((post, index) => (
                            <BoardCard key={post.slug} post={post} index={index} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 opacity-20 italic">
                            No articles found.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
