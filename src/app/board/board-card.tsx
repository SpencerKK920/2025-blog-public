'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { BlogIndexItem } from '@/hooks/use-blog-index'

export function BoardCard({ post, index }: { post: BlogIndexItem; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="w-full group"
        >
            <Link 
                href={`/blog/${post.slug}`} 
                className="flex flex-col sm:flex-row h-full sm:h-48 overflow-hidden squircle bg-card border shadow-sm hover:shadow-xl hover:border-brand/30 transition-all duration-300"
            >
                {/* 左侧封面图：宽度固定，高度自适应 */}
                <div className="relative w-full sm:w-72 h-48 sm:h-full overflow-hidden shrink-0 bg-secondary/5 border-r border-border/50">
                    <img
                        src={post.cover}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </div>

                {/* 右侧内容区域 */}
                <div className="flex-1 flex flex-col p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase bg-brand text-white rounded-sm">
                            {post.category || 'Article'}
                        </span>
                        <span className="text-[10px] text-secondary font-mono opacity-50">
                            {post.date.split('T')[0]}
                        </span>
                    </div>

                    <h2 className="text-xl md:text-2xl font-bold mb-3 font-averia group-hover:text-brand transition-colors line-clamp-1 italic">
                        {post.title}
                    </h2>

                    <p className="text-xs md:text-sm text-secondary/70 leading-relaxed line-clamp-2 mb-4">
                        {post.summary || "点击阅读这篇关于系统开发与设计的深度分享..."}
                    </p>

                    <div className="mt-auto flex items-center justify-between">
                        <div className="text-[10px] font-bold text-brand flex items-center gap-1">
                            READ ARTICLE 
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}
