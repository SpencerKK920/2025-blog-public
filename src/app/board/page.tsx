'use client'

import { useBlogIndex } from '@/hooks/use-blog-index'
import { motion } from 'motion/react'
import { BlogBillboard } from './blog-billboard'
import clsx from 'clsx'

export default function BoardPage() {
    const { blogIndex, loading } = useBlogIndex()

    // 借鉴 /blog 的逻辑：
    // 如果没有特别指定的置顶文章，默认展示 index.json 里的第一篇
    const featuredPost = blogIndex && blogIndex.length > 0 ? blogIndex[0] : null

    return (
        <div className="flex flex-col items-center px-6 pt-32 pb-12 min-h-screen">
            {/* 这里的样式与 /blog 保持一致 */}
            <div className='mb-16 text-center'>
                <h1 className='font-averia text-4xl font-bold tracking-tight uppercase tracking-widest italic'>
                    Studio Board
                </h1>
                <div className='bg-brand mt-2 h-1 w-12 mx-auto rounded-full' />
            </div>

            {loading ? (
                // 模拟 /blog 的加载效果
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
