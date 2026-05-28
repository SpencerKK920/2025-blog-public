'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BlogIndexItem } from '@/hooks/use-blog-index'

interface TagPanelProps {
    items: BlogIndexItem[]
    selectedTags: Set<string>
    onTagsChange: (tags: Set<string>) => void
    isOpen: boolean
    onToggle: () => void
    matchedCount: number
}

function tagSizeClass(count: number, max: number): string {
    if (max <= 1) return 'text-xs'
    const ratio = count / max
    if (ratio > 0.7) return 'text-sm font-bold'
    if (ratio > 0.4) return 'text-sm font-medium'
    return 'text-xs'
}

export function TagPanel({ items, selectedTags, onTagsChange, isOpen, onToggle, matchedCount }: TagPanelProps) {
    const tagCounts = useMemo(() => {
        const map: Record<string, number> = {}
        items.forEach(item => {
            ;(item.tags || []).forEach(tag => {
                map[tag] = (map[tag] || 0) + 1
            })
        })
        return Object.entries(map).sort((a, b) => b[1] - a[1])
    }, [items])

    const maxCount = tagCounts.length > 0 ? tagCounts[0][1] : 1

    const toggleTag = (tag: string) => {
        const next = new Set(selectedTags)
        if (next.has(tag)) {
            next.delete(tag)
        } else {
            next.add(tag)
        }
        onTagsChange(next)
    }

    const clearAll = () => onTagsChange(new Set())

    return (
        <>
            {/* Toggle button - always visible */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggle}
                className={cn(
                    'fixed right-6 top-24 z-20 flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium backdrop-blur-md transition-colors',
                    isOpen
                        ? 'bg-brand/10 border-brand/30 text-brand'
                        : 'bg-white/40 border-white/30 text-secondary hover:text-brand hover:border-brand/30'
                )}
            >
                <Tag className="w-3.5 h-3.5" />
                标签
                {selectedTags.size > 0 && (
                    <span className="bg-brand text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                        {selectedTags.size}
                    </span>
                )}
            </motion.button>

            {/* Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 240, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="overflow-hidden shrink-0"
                    >
                        <div className="w-[240px] pl-4">
                            <div className="sticky top-28 bg-white/30 backdrop-blur-xl border border-white/40 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold tracking-widest uppercase text-secondary/70">
                                        标签筛选
                                    </h3>
                                    {selectedTags.size > 0 && (
                                        <button
                                            onClick={clearAll}
                                            className="text-[10px] text-brand hover:underline"
                                        >
                                            清除
                                        </button>
                                    )}
                                </div>

                                {tagCounts.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {tagCounts.map(([tag, count]) => {
                                            const isSelected = selectedTags.has(tag)
                                            return (
                                                <motion.button
                                                    key={tag}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => toggleTag(tag)}
                                                    className={cn(
                                                        'rounded-full px-3 py-1 transition-all',
                                                        tagSizeClass(count, maxCount),
                                                        isSelected
                                                            ? 'bg-brand text-white shadow-sm'
                                                            : 'bg-white/50 text-secondary/70 hover:text-brand hover:bg-white/80 border border-white/40'
                                                    )}
                                                >
                                                    #{tag}
                                                    <span className="ml-1 opacity-50 text-[10px]">{count}</span>
                                                </motion.button>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-secondary/40">暂无标签</p>
                                )}

                                {selectedTags.size > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-4 pt-3 border-t border-border/50"
                                    >
                                        <p className="text-[10px] text-secondary/60">
                                            已选 <span className="text-brand font-bold">{selectedTags.size}</span> 个，
                                            匹配 <span className="text-brand font-bold">{matchedCount}</span> 篇
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </>
    )
}
