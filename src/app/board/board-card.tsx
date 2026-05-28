'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { BlogIndexItem } from '@/hooks/use-blog-index'

interface BoardCardProps {
    post: BlogIndexItem
    index: number
    isRead?: boolean
    editMode?: boolean
    onEditClick?: (e: React.MouseEvent, slug: string) => void
}

export function BoardCard({ post, index, isRead, editMode, onEditClick }: BoardCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="w-full group"
        >
            <Link
                href={`/blog/${post.slug}`}
                onClick={editMode ? (e) => onEditClick?.(e, post.slug) : undefined}
                className="flex flex-col sm:flex-row h-full sm:h-48 overflow-hidden squircle bg-card border shadow-sm hover:shadow-xl hover:border-brand/30 transition-all duration-300"
            >
                {/* Cover — only shown when present */}
                {post.cover && (
                    <div className="relative w-full sm:w-72 h-48 sm:h-full overflow-hidden shrink-0 bg-secondary/5 border-r border-border/50">
                        <img
                            src={post.cover}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>
                )}

                {/* Content */}
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
                        {isRead && (
                            <span className="text-secondary ml-2 text-xs not-italic font-normal">[已阅读]</span>
                        )}
                    </h2>

                    <p className="text-xs md:text-sm text-secondary/70 leading-relaxed line-clamp-2 mb-4">
                        {post.summary || '点击阅读这篇关于系统开发与设计的深度分享...'}
                    </p>

                    <div className="mt-auto flex items-center justify-between">
                        <div className="text-[10px] font-bold text-brand flex items-center gap-1">
                            READ ARTICLE
                            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                        </div>
                        {(post.tags || []).length > 0 && (
                            <div className="hidden sm:flex items-center gap-1.5">
                                {(post.tags || []).slice(0, 3).map(t => (
                                    <span
                                        key={t}
                                        className="text-[9px] text-secondary/40 bg-secondary/5 px-1.5 py-0.5 rounded"
                                    >
                                        #{t}
                                    </span>
                                ))}
                                {(post.tags || []).length > 3 && (
                                    <span className="text-[9px] text-secondary/30">
                                        +{post.tags.length - 3}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}
