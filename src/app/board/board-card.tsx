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
                href={`/blog/${post.slug}`} 
                className="flex flex-col sm:flex-row h-full overflow-hidden squircle bg-card border shadow-sm hover:shadow-xl transition-all duration-300"
            >
                {/* 封面图：缩小高度和宽度占比 */}
                <div className="relative w-full sm:w-1/3 h-40 sm:h-auto overflow-hidden shrink-0 bg-secondary/5">
                    <img
                        src={post.cover}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </div>

                {/* 内容区域：更加紧凑 */}
                <div className="flex-1 flex flex-col p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-1.5 py-0.5 text-[8px] font-bold tracking-tighter uppercase bg-brand/10 text-brand rounded">
                            {post.category || 'Studio'}
                        </span>
                        <span className="text-[10px] text-secondary font-mono opacity-50">
                            {post.date.split('T')[0]}
                        </span>
                    </div>

                    <h2 className="text-lg font-bold mb-2 font-averia group-hover:text-brand transition-colors line-clamp-1">
                        {post.title}
                    </h2>

                    <p className="text-xs text-secondary/70 leading-relaxed line-clamp-2 mb-4">
                        {post.summary || "点击阅读详情..."}
                    </p>

                    <div className="mt-auto text-[9px] font-bold text-brand flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        READ MORE →
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}
