'use client'

import { useMemo } from 'react'
import { motion } from 'motion/react'
import dayjs from 'dayjs'
import { cn } from '@/lib/utils'
import type { BlogIndexItem } from '@/hooks/use-blog-index'

interface TimelineProps {
    items: BlogIndexItem[]
    activeGroup: string | null
    onGroupClick: (key: string) => void
}

interface YearGroup {
    year: string
    months: { key: string; label: string; count: number }[]
}

export function Timeline({ items, activeGroup, onGroupClick }: TimelineProps) {
    const yearGroups = useMemo(() => {
        const map: Record<string, Record<string, number>> = {}
        items.forEach(item => {
            const d = dayjs(item.date)
            const y = d.format('YYYY')
            const mKey = d.format('YYYY-MM')
            if (!map[y]) map[y] = {}
            map[y][mKey] = (map[y][mKey] || 0) + 1
        })

        const years = Object.keys(map).sort((a, b) => b.localeCompare(a))
        return years.map(year => ({
            year,
            months: Object.keys(map[year])
                .sort((a, b) => b.localeCompare(a))
                .map(key => ({
                    key,
                    label: dayjs(key + '-01').format('MM月'),
                    count: map[year][key]
                }))
        }))
    }, [items])

    const totalCount = items.length

    return (
        <nav className="flex flex-col gap-1 pr-3">
            <div className="flex items-center gap-2 px-1 mb-3">
                <span className="text-xs font-bold tracking-widest uppercase text-secondary/60">
                    时间线
                </span>
                <span className="text-xs text-secondary/40">{totalCount}篇</span>
            </div>

            {yearGroups.map(({ year, months }) => (
                <div key={year} className="mb-1">
                    <div className="text-sm font-bold text-primary/60 py-1 px-1 tracking-wider">
                        {year}年
                    </div>
                    {months.map(({ key, label, count }) => {
                        const isActive = activeGroup === key
                        return (
                            <motion.button
                                key={key}
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => onGroupClick(key)}
                                className={cn(
                                    'w-full flex items-center gap-2 py-2 px-2 rounded-lg text-left transition-colors group',
                                    isActive
                                        ? 'bg-brand/10 text-brand'
                                        : 'text-secondary/70 hover:text-primary hover:bg-white/40'
                                )}
                            >
                                <span
                                    className={cn(
                                        'w-1.5 h-1.5 rounded-full shrink-0 transition-all',
                                        isActive ? 'bg-brand scale-125' : 'bg-secondary/30 group-hover:bg-secondary/50'
                                    )}
                                />
                                <span className="text-sm font-medium">{label}</span>
                                <span className={cn(
                                    'text-xs ml-auto',
                                    isActive ? 'text-brand/60' : 'text-secondary/40'
                                )}>
                                    {count}
                                </span>
                            </motion.button>
                        )
                    })}
                </div>
            ))}

            {yearGroups.length === 0 && (
                <p className="text-[10px] text-secondary/40 px-2 py-4">暂无文章</p>
            )}
        </nav>
    )
}
