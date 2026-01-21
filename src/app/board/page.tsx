'use client'

import { useBlogIndex } from '@/hooks/use-blog-index'
import { motion } from 'motion/react'
import { BlogBillboard } from './blog-billboard'

export default function FeaturedBoardPage() {
    const { blogIndex, loading } = useBlogIndex()

    // 【数据识别逻辑】
    // 自动寻找你博客文件夹里标题包含“影视”或者“追踪”的文章
    // 如果没有特定标题的文章，则默认展示最新发布的一篇
    const featuredPost = blogIndex?.find(post => 
        post.title.includes('影视') || post.title.includes('追踪')
    ) || blogIndex?.[0]

    return (
        <div className="flex flex-col items-center px-6 pt-32 pb-12 min-h-[80vh]">
            {/* 顶部的艺术化标题 */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className='mb-16 text-center'
            >
                <h1 className='font-averia text-4xl md:text-5xl font-bold tracking-tight uppercase tracking-widest italic'>
                    Studio Board
                </h1>
                <div className='bg-brand mt-4 h-1.5 w-16 mx-auto rounded-full' />
            </motion.div>

            {loading ? (
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="w-24 h-24 bg-secondary/10 rounded-full" />
                    <span className="text-brand font-mono text-sm uppercase tracking-tighter">Indexing Blogs...</span>
                </div>
            ) : (
                <div className="w-full max-w-[1200px]">
                    {/* 直接显示识别到的博客文章看板 */}
                    {featuredPost ? (
                        <BlogBillboard post={featuredPost} />
                    ) : (
                        <div className="text-center p-20 border border-dashed rounded-3xl opacity-30 italic">
                            没有在 blog 文件夹中找到相关文章
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
