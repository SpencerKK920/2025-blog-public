'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { BlogIndexItem } from '@/hooks/use-blog-index'

export function BlogBillboard({ post }: { post: BlogIndexItem }) {
    if (!post) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full group"
        >
            <Link 
                href={`/blog/${post.slug}`} // 修正：使用 slug
                className="flex flex-col md:flex-row overflow-hidden squircle bg-card border shadow-sm hover:shadow-2xl transition-all duration-500"
            >
                {/* 封面图：直接使用 post.cover，因为它已包含完整路径 */}
                <div className="relative w-full h-64 md:h-[480px] md:w-7/12 overflow-hidden shrink-0 bg-secondary/5">
                    <img
                        src={post.cover}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/20 to-transparent opacity-60" />
                </div>

                <div className="flex-1 flex flex-col justify-center p-10 md:p-14">
                    <div className="mb-6">
                        <span className="px-3 py-1 text-[10px] font-bold tracking-widest uppercase bg-brand text-white rounded-full">
                            {post.category || 'Featured'} 
                        </span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-bold mb-6 font-averia italic group-hover:text-brand transition-colors leading-tight">
                        {post.title}
                    </h2>

                    <p className="text-sm md:text-base text-secondary/80 leading-relaxed line-clamp-4 mb-10">
                        {post.summary || "点击进入阅读这篇精选文章的详细内容..."}
                    </p>

                    <div className="text-sm font-bold text-brand flex items-center gap-2">
                        CONTINUE READING
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}
