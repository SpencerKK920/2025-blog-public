'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link' // 关键点：引入 Link 组件
import { motion } from 'motion/react'
import { Calendar as CalendarIcon, ArrowUpRight } from 'lucide-react'

export default function CalendarCard() {
    const [date, setDate] = useState<Date | null>(null)

    useEffect(() => {
        setDate(new Date())
    }, [])

    if (!date) return (
        <div className="card aspect-square p-6 flex items-center justify-center bg-zinc-100 animate-pulse rounded-3xl" />
    )

    const dayName = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][date.getDay()]
    const monthName = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][date.getMonth()]

    return (
        // 关键点：这里使用了 Link 包裹，点击后跳转到 /schedule
        <Link href="/schedule" className="block h-full">
            <motion.div 
                whileHover={{ scale: 0.98 }}
                whileTap={{ scale: 0.95 }}
                className="group relative h-full w-full overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
                {/* 悬浮时的右上角箭头提示 */}
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                    <ArrowUpRight className="w-6 h-6" />
                </div>

                <div className="flex items-center gap-2">
                    <div className="p-2 bg-red-500/10 rounded-xl text-red-500">
                        <CalendarIcon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold tracking-widest text-secondary group-hover:text-primary transition-colors">SCHEDULE</span>
                </div>

                <div className="flex flex-col items-center justify-center flex-1 py-4">
                    <span className="text-xs font-bold text-red-500 tracking-[0.2em] mb-2">{dayName}</span>
                    <span className="text-7xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-100 group-hover:scale-110 transition-transform duration-300">
                        {date.getDate()}
                    </span>
                    <span className="text-lg font-medium text-zinc-400 mt-2">{monthName} {date.getFullYear()}</span>
                </div>

                <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[30%] group-hover:w-full transition-all duration-500 ease-out" />
                </div>
            </motion.div>
        </Link>
    )
}
