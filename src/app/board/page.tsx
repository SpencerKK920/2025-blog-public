'use client'

import { useBlogIndex } from '@/hooks/use-blog-index'
import { motion } from 'motion/react'
import { BoardCard } from './board-card' // 我们稍后创建这个更精致的卡片组件

export default function BoardPage() {
    const { items, loading } = useBlogIndex()

    return (
        <div className="flex flex-col items-center px-6 pt-32 pb-12 min-h-screen">
            <div className='mb-12 text-center'>
                <h1 className='font-averia text-4xl font-bold tracking-tight uppercase tracking-widest italic'>
                    Studio Board
                </h1>
                <div className='bg-brand mt-2 h-1 w-12 mx-auto rounded-full' />
            </div>

            {loading ? (
                <div className="flex flex-col items-center gap-4 mt-20">
                    <div className="w-8 h-8 border-2 border-brand/30 border-t-brand animate-spin rounded-full" />
                    <p className="text-[10px] font-mono text-brand uppercase tracking-widest">Loading Library...</p>
                </div>
            ) : (
                /* 修正：这里使用 map 循环渲染所有文章，解决“只显示一个”的问题 */
                <div className="w-full max-w-[1200px] grid grid-cols-1 md:grid-cols-2 gap-8">
                    {items && items.length > 0 ? (
                        items.map((post, index) => (
                            <BoardCard key={post.slug} post={post} index={index} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 opacity-20 italic">No articles indexed.</div>
                    )}
                </div>
            )}
        </div>
    )
}
