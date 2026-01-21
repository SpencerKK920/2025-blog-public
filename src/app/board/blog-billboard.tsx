'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { BlogIndexItem } from '@/hooks/use-blog-index'

export function BoardCard({ post, index }: { post: BlogIndexItem; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="w-full group"
        >
            <Link 
                href={`/blog/${post.slug}`} // 修正：链接到详情页
                className="flex flex-col sm:flex-row h-full overflow-hidden squircle bg-card border shadow-sm hover:shadow-xl transition-all duration-300"
            >
                {/* 左侧封面：高度大幅度缩减 */}
                <div className="relative w-full sm:w-2/5 h-48 sm:h-auto overflow-hidden shrink-0 bg-secondary/5">
                    <img
                        src={post.cover} // 修正：直接使用 index.json 里的 cover 路径
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </div>

                {/* 右侧内容 */}
                <div className="flex-1 flex flex-col p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 text-[9px] font-bold tracking-tighter uppercase bg-brand/10 text-brand rounded">
                            {post.category || 'Post'}
                        </span>
                        <span className="text-[10px] text-secondary font-mono opacity-50">{post.date.split('T')[0]}</span>
                    </div>

                    <h2 className="text-xl font-bold mb-3 font-averia group-hover:text-brand transition-colors line-clamp-2">
                        {post.title}
                    </h2>

                    <p className="text-xs text-secondary/70 leading-relaxed line-clamp-2 mb-4">
                        {post.summary || "点击阅读全文..."}
                    </p>

                    <div className="mt-auto text-[10px] font-bold text-brand flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        VIEW DETAILS →
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}
