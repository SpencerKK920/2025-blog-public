'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { BlogIndexItem } from '../types'

export function BlogBillboard({ post }: { post: BlogIndexItem }) {
    if (!post) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[1200px] mx-auto mb-16 group"
        >
            <Link 
                href={`/blog/${post.id}`} 
                className="block relative flex flex-col md:flex-row overflow-hidden squircle bg-card border shadow-sm hover:shadow-2xl transition-all duration-500"
            >
                {/* 左侧：文章封面 (占比 5/12) */}
                <div className="relative w-full h-64 md:h-[450px] md:w-5/12 overflow-hidden shrink-0">
                    <img
                        src={`/blogs/${post.id}/${post.cover}`}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* 移动端底部渐变，桌面端右侧渐变 */}
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/20 to-transparent opacity-40" />
                </div>

                {/* 右侧：内容区域 */}
                <div className="flex-1 flex flex-col justify-center p-8 md:p-12">
                    {/* 分类标签 */}
                    <div className="mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold tracking-widest uppercase bg-brand/10 text-brand rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                            FEATURED POST
                        </span>
                    </div>

                    {/* 标题 - 使用你项目中的 font-averia */}
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight leading-tight group-hover:text-brand transition-colors font-averia italic">
                        {post.title}
                    </h2>

                    {/* 元数据：日期 */}
                    <div className="flex items-center gap-2 text-xs text-secondary mb-6 font-mono opacity-70">
                        {new Date(post.date).toLocaleDateString('zh-CN', {
                            year: 'numeric', month: 'long', day: 'numeric'
                        })}
                    </div>

                    {/* 摘要 (从你的 config.json 或描述中提取) */}
                    <p className="text-sm md:text-base text-secondary/80 leading-relaxed line-clamp-3 mb-8">
                        {post.description || "点击进入阅读这篇文章的详细内容..."}
                    </p>

                    {/* 交互引导 */}
                    <div className="flex items-center text-sm font-bold text-brand group/btn">
                        继续阅读
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}
