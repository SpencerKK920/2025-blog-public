'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { 
    ChevronLeft, ChevronRight, CheckCircle2, Circle, Plus, Trash2, 
    ArrowLeft, Calendar as CalendarIcon, Edit3, Save, X, ListTodo,
    Clock
} from 'lucide-react'
import { toast } from 'sonner'

import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { pushTasks } from './services/push-tasks'
import initialData from './tasks.json'

// --- 类型定义 ---
type Task = {
    id: string
    text: string
    completed: boolean
}
type TaskMap = Record<string, Task[]>

// 辅助函数：获取本地 YYYY-MM-DD 字符串，解决时区导致的日期偏移
const getLocalDateString = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

export default function SchedulePage() {
    // --- 状态管理 ---
    const [mounted, setMounted] = useState(false) // 修复水合错误
    const [tasks, setTasks] = useState<TaskMap>(initialData as TaskMap)
    const [originalData, setOriginalData] = useState<TaskMap>(initialData as TaskMap)
    
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [newTask, setNewTask] = useState('')
    
    const [isEditMode, setIsEditMode] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const keyInputRef = useRef<HTMLInputElement>(null)

    const { isAuth, setPrivateKey } = useAuthStore()
    const { siteContent } = useConfigStore()
    const hideEditButton = siteContent.hideEditButton ?? false

    // 初始挂载检查
    useEffect(() => {
        setMounted(true)
    }, [])

    // --- 日历逻辑 ---
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const firstDayOfWeek = new Date(year, month, 1).getDay()
        return { daysInMonth, firstDayOfWeek }
    }

    const { daysInMonth, firstDayOfWeek } = getDaysInMonth(currentDate)
    const daysArray = Array.from({ length: 42 }, (_, i) => {
        const dayNum = i - firstDayOfWeek + 1
        return (dayNum > 0 && dayNum <= daysInMonth) ? dayNum : null
    })

    // 修复：使用本地时间 Key
    const dateKey = getLocalDateString(selectedDate)
    const currentTasks = tasks[dateKey] || []

    // --- 交互处理 ---
    const handleChoosePrivateKey = async (file: File) => {
        try {
            const text = await file.text()
            setPrivateKey(text)
            toast.success('密钥读取成功')
        } catch (error) {
            toast.error('读取密钥文件失败')
        }
    }

    const handleSaveClick = () => {
        if (!isAuth) keyInputRef.current?.click()
        else handleSave()
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await pushTasks(tasks)
            setOriginalData(tasks)
            setIsEditMode(false)
            toast.success('日程保存成功')
        } catch (error: any) {
            toast.error(`保存失败: ${error?.message || '未知错误'}`)
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        setTasks(originalData)
        setIsEditMode(false)
        toast.info('已取消更改')
    }

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault()
        if (!isEditMode) return toast.warning('请先进入编辑模式')
        if (!newTask.trim()) return

        // 增加兜底的 ID 生成，防止 crypto 在非 HTTPS 下报错
        const id = typeof crypto !== 'undefined' && crypto.randomUUID 
            ? crypto.randomUUID() 
            : Math.random().toString(36).substring(2, 9)

        const task: Task = { id, text: newTask.trim(), completed: false }
        setTasks(prev => ({ ...prev, [dateKey]: [...(prev[dateKey] || []), task] }))
        setNewTask('')
    }

    const toggleTask = (taskId: string) => {
        if (!isEditMode) return
        setTasks(prev => ({
            ...prev,
            [dateKey]: prev[dateKey].map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
        }))
    }

    const deleteTask = (taskId: string) => {
        if (!isEditMode) return
        setTasks(prev => ({
            ...prev,
            [dateKey]: prev[dateKey].filter(t => t.id !== taskId)
        }))
    }

    const changeMonth = (delta: number) => {
        const newDate = new Date(currentDate)
        newDate.setMonth(newDate.getMonth() + delta)
        setCurrentDate(newDate)
    }

    const getDayStatus = (day: number) => {
        const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
        const key = getLocalDateString(checkDate)
        const dayTasks = tasks[key] || []
        return {
            has: dayTasks.length > 0,
            allDone: dayTasks.length > 0 && dayTasks.every(t => t.completed)
        }
    }

    // 如果未挂载完成，不渲染内容以防止 Hydration Error
    if (!mounted) return null

    return (
        <>
            <input ref={keyInputRef} type='file' accept='.pem' className='hidden' onChange={async e => {
                const f = e.target.files?.[0]
                if (f) await handleChoosePrivateKey(f)
                if (e.currentTarget) e.currentTarget.value = ''
            }} />

            {/* 全局容器 */}
            <div className="min-h-screen w-full flex flex-col items-center pt-24 pb-12 px-4 md:px-8">
                
                {/* 顶部返回按钮 - top-12 解决重叠 */}
                <div className='fixed top-12 left-6 z-20'>
                     <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-md shadow-sm border border-white/20 hover:bg-white/60 transition-all text-secondary hover:text-primary">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-medium text-sm">返回首页</span>
                    </Link>
                </div>

                <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[720px]">
                    
                    {/* === 左侧：日历卡片 === */}
                    <div className="lg:col-span-8 h-full flex flex-col">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex-1 flex flex-col bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] p-8 shadow-sm transition-all ${isEditMode ? 'ring-2 ring-primary/20' : ''}`}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/60 dark:bg-white/10 rounded-2xl shadow-sm text-primary backdrop-blur-md">
                                        <CalendarIcon className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">
                                            {currentDate.getFullYear()}年 
                                        </h2>
                                        <p className="text-zinc-500 font-medium text-lg ml-0.5">
                                            {currentDate.getMonth() + 1}月
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => changeMonth(-1)} className="p-3 bg-white/30 hover:bg-white/60 rounded-2xl border border-white/30 transition-all text-zinc-600">
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button onClick={() => changeMonth(1)} className="p-3 bg-white/30 hover:bg-white/60 rounded-2xl border border-white/30 transition-all text-zinc-600">
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 mb-4 px-2">
                                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                                    <div key={d} className="text-center text-xs font-bold text-zinc-400 py-2 tracking-widest opacity-60">{d}</div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-4 flex-1 content-between">
                                {daysArray.map((day, i) => {
                                    if (!day) return <div key={i} /> 
                                    const isSelected = day === selectedDate.getDate() && currentDate.getMonth() === selectedDate.getMonth()
                                    // 修正：今天日期的判定也使用本地时间
                                    const today = new Date()
                                    const isToday = day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()
                                    const status = getDayStatus(day)

                                    return (
                                        <motion.button
                                            key={i}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                                            className={`
                                                relative w-full h-full min-h-[60px] rounded-2xl flex flex-col items-center justify-center text-xl transition-all duration-200
                                                ${isSelected 
                                                    ? 'bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xl scale-105 z-10 font-bold' 
                                                    : 'hover:bg-white/40 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300'}
                                                ${isToday && !isSelected ? 'text-red-500 font-bold bg-red-500/10' : ''}
                                            `}
                                        >
                                            {day}
                                            {status.has && (
                                                <div className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${
                                                    status.allDone 
                                                        ? 'bg-green-500' 
                                                        : (isSelected ? 'bg-white/70 dark:bg-black/50' : 'bg-red-500')
                                                }`} />
                                            )}
                                        </motion.button>
                                    )
                                })}
                            </div>
                        </motion.div>
                    </div>

                    {/* === 右侧：任务详情 === */}
                    <div className="lg:col-span-4 h-full flex flex-col">
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex-1 flex flex-col bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-sm ${isEditMode ? 'ring-2 ring-primary/20' : ''}`}
                        >
                            <div className="p-8 pb-4 flex-none">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-500 backdrop-blur-sm">
                                        <ListTodo className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-mono text-zinc-500 bg-white/40 px-3 py-1 rounded-full border border-white/20">
                                        {dateKey}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">待办事项</h3>
                                <p className="text-sm text-zinc-500 mt-1 font-medium">
                                    {currentTasks.length > 0 ? `这里有 ${currentTasks.length} 个任务` : '今天暂无安排'}
                                </p>
                            </div>

                            <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-300/30 to-transparent flex-none" />

                            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                                <AnimatePresence mode='popLayout'>
                                    {currentTasks.length === 0 ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-zinc-400 gap-4 opacity-60">
                                            <div className="p-4 rounded-full bg-white/30 border border-white/20">
                                                <Clock className="w-8 h-8 stroke-[1.5]" />
                                            </div>
                                            <p className="text-sm font-medium">享受自由时光</p>
                                        </motion.div>
                                    ) : (
                                        currentTasks.map(task => (
                                            <motion.div
                                                layout
                                                key={task.id}
                                                className={`group relative flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${
                                                    task.completed 
                                                        ? 'bg-zinc-100/30 border-transparent opacity-50 grayscale' 
                                                        : 'bg-white/60 border-white/40 shadow-sm hover:bg-white/80'
                                                }`}
                                            >
                                                <button 
                                                    onClick={() => toggleTask(task.id)}
                                                    disabled={!isEditMode}
                                                    className={`shrink-0 ${isEditMode ? 'cursor-pointer' : 'cursor-default'}`}
                                                >
                                                    {task.completed 
                                                        ? <CheckCircle2 className="w-6 h-6 text-green-500" /> 
                                                        : <Circle className="w-6 h-6 text-zinc-400 hover:text-primary transition-colors" />
                                                    }
                                                </button>
                                                <span className={`flex-1 text-sm font-medium leading-relaxed ${task.completed ? 'line-through text-zinc-400' : 'text-zinc-700 dark:text-zinc-200'}`}>
                                                    {task.text}
                                                </span>
                                                {isEditMode && (
                                                    <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-500 absolute right-2 bg-white/80 backdrop-blur rounded-lg">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>

                            {isEditMode && (
                                <div className="p-4 bg-white/30 backdrop-blur-md flex-none border-t border-white/20">
                                    <form onSubmit={handleAddTask} className="relative">
                                        <input
                                            type="text"
                                            value={newTask}
                                            onChange={(e) => setNewTask(e.target.value)}
                                            placeholder="输入任务..."
                                            className="w-full bg-white/70 border-none rounded-2xl py-3.5 pl-4 pr-12 text-sm outline-none shadow-inner focus:ring-2 focus:ring-primary/20"
                                        />
                                        <button type="submit" disabled={!newTask.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-xl disabled:opacity-50 shadow-lg shadow-primary/20">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* 操作控制台 */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='fixed top-6 right-6 z-20 flex gap-3 max-sm:hidden'>
                {isEditMode ? (
                    <>
                        <button onClick={handleCancel} disabled={isSaving} className='flex items-center gap-2 rounded-full bg-white/40 dark:bg-black/40 px-5 py-2.5 text-sm font-medium backdrop-blur-md border border-white/20 text-zinc-600'>
                            <X className="w-4 h-4" /> 取消
                        </button>
                        <button onClick={handleSaveClick} disabled={isSaving} className='brand-btn px-6 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-primary/20 bg-primary text-white'>
                            <Save className="w-4 h-4" /> {isSaving ? '保存中...' : (isAuth ? '保存更新' : '导入密钥')}
                        </button>
                    </>
                ) : (
                    !hideEditButton && (
                        <button onClick={() => setIsEditMode(true)} className='flex items-center gap-2 rounded-full bg-white/40 dark:bg-black/40 px-5 py-2.5 text-sm font-medium backdrop-blur-md border border-white/20 text-zinc-600'>
                            <Edit3 className="w-4 h-4" /> 编辑日程
                        </button>
                    )
                )}
            </motion.div>
        </>
    )
}
