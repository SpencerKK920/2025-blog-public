'use client'

import { useBlogIndex } from '@/hooks/use-blog-index'
import { motion } from 'motion/react'
import { BlogBillboard } from './blog-billboard'

export default function BoardPage() {
    // 关键修正：Hook 返回的是 items 而不是 blogIndex
    const { items, loading } = useBlogIndex()

    // 自动识别：优先找标题包含“开发”或“博客”的文章，否则取第一篇
    const featuredPost = items && items.length > 0 
        ? items.find(p => p.title.includes('开发') || p.title.includes('博客')) || items[0] 
        : null

    return (
        <div className="flex flex-col items-center px-6 pt-32 pb-12 min-h-screen">
            <div className='mb-16 text-center'>
                <h1 className='font-averia text-4xl font-bold tracking-tight uppercase tracking-widest italic'>
                    Studio Board
                </h1>
                <div className='bg-brand mt-2 h-1 w-12 mx-auto rounded-full' />
            </div>

            {loading ? (
                <div className="flex flex-col items-center gap-4 mt-20">
                    <div className="w-10 h-10 border-2 border-brand/30 border-t-brand animate-spin rounded-full" />
                    <p className="text-xs font-mono text-brand uppercase tracking-widest">Loading Article...</p>
                </div>
            ) : (
                <div className="w-full max-w-[1200px]">
                    {featuredPost ? (
                        <BlogBillboard post={featuredPost} />
                    ) : (
                        <div className="text-center p-20 border border-dashed rounded-3xl opacity-20 italic">
                            No articles found in blog index.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
