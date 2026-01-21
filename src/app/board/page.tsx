'use client'

import { useBlogIndex } from '@/hooks/use-blog-index'
import { motion } from 'motion/react'
import { BlogBillboard } from './blog-billboard'
import { useEffect } from 'react'

export default function FeaturedBoardPage() {
    const { blogIndex, loading } = useBlogIndex()

    // 【调试代码】在浏览器控制台查看数据是否真的进来了
    useEffect(() => {
        if (blogIndex) {
            console.log("当前识别到的所有博客数据:", blogIndex)
        }
    }, [blogIndex])

    // 【增强版识别逻辑】
    // 1. 优先寻找你标记为 featured 的文章 (如果你在 config.json 里加了的话)
    // 2. 其次寻找标题里带关键信息的文章
    // 3. 如果都找不到，直接显示最新发布的那篇 (确保页面不空)
    const featuredPost = blogIndex?.find(post => 
        post.title.includes('系统') || post.title.includes('追踪') || post.title.includes('看板')
    ) || blogIndex?.[0]

    return (
        <div className="flex flex-col items-center px-6 pt-32 pb-12 min-h-screen">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='mb-16 text-center'>
                <h1 className='font-averia text-4xl md:text-5xl font-bold tracking-tight uppercase tracking-widest italic'>
                    Studio Board
                </h1>
                <div className='bg-brand mt-4 h-1.5 w-16 mx-auto rounded-full' />
            </motion.div>

            {loading ? (
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="w-12 h-12 rounded-full border-2 border-brand/20 border-t-brand animate-spin" />
                    <span className="text-brand font-mono text-xs uppercase tracking-widest">Indexing Blogs...</span>
                </div>
            ) : (
                <div className="w-full max-w-[1200px]">
                    {featuredPost ? (
                        <BlogBillboard post={featuredPost} />
                    ) : (
                        /* 这里的提示能告诉你问题出在哪 */
                        <div className="text-center p-20 border border-dashed rounded-3xl opacity-30 italic">
                            {blogIndex?.length === 0 
                                ? "blog 文件夹下似乎没有文章数据，请确认 public/blogs/index.json 是否有内容" 
                                : "已识别到博客，但未能匹配到置顶文章"}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
