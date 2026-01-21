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

export default function SchedulePage() {
    // --- 状态管理 ---
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

    const dateKey = selectedDate.toISOString().split('T')[0]
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

        const task: Task = { id: crypto.randomUUID(), text: newTask.trim(), completed: false }
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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isEditMode && (e.ctrlKey || e.metaKey) && e.key === ',') {
                e.preventDefault()
                setIsEditMode(true)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isEditMode])

    const getDayStatus = (day: number) => {
        const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
        const key = checkDate.toISOString().split('T')[0]
        const dayTasks = tasks[key] || []
        return {
            has: dayTasks.length > 0,
            allDone: dayTasks.length > 0 && dayTasks.every(t => t.completed)
        }
    }

    return (
        <>
            <input ref={keyInputRef} type='file' accept='.pem' className='hidden' onChange={async e => {
                const f = e.target.files?.[0]
                if (f) await handleChoosePrivateKey(f)
                if (e.currentTarget) e.currentTarget.value = ''
            }} />

            {/* 全局容器 */}
            <div className="min-h-screen w-full flex flex-col items-center pt-24 pb-12 px-4 md:px-8">
                
                {/* 顶部返回按钮 (固定) */}
                <div className='fixed top-6 left-6 z-20'>
                     <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-md shadow-sm border border-white/20 hover:bg-white/60 transition-all text-secondary hover:text-primary">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-medium text-sm">返回首页</span>
                    </Link>
                </div>

                {/* 核心布局：Grid 容器 */}
                {/* min-h-[720px] 强制了最小高度，h-full 强制子元素填满 */}
                <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[720px]">
                    
                    {/* === 左侧：日历卡片 (占8列，强制填满高度) === */}
                    <div className="lg:col-span-8 h-full flex flex-col">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            // 样式核心：bg-white/40 + backdrop-blur-xl (毛玻璃)
                            className={`flex-1 flex flex-col bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] p-8 shadow-sm transition-all ${isEditMode ? 'ring-2 ring-primary/20' : ''}`}
                        >
                            {/* 日历头部 */}
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

                            {/* 星期表头 */}
                            <div className="grid grid-cols-7 mb-4 px-2">
                                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                                    <div key={d} className="text-center text-xs font-bold text-zinc-400 py-2 tracking-widest opacity-60">{d}</div>
                                ))}
                            </div>

                            {/* 日期网格 - 使用 flex-1 自动撑开高度 */}
                            <div className="grid grid-cols-7 gap-4 flex-1 content-between">
                                {daysArray.map((day, i) => {
                                    if (!day) return <div key={i} /> 
                                    const isSelected = day === selectedDate.getDate() && currentDate.getMonth() === selectedDate.getMonth()
                                    const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear()
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
                                            
                                            {/* 状态点 */}
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

                    {/* === 右侧：任务长条 (占4列，强制填满高度) === */}
                    <div className="lg:col-span-4 h-full flex flex-col">
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            // 样式核心：与左侧完全一致的玻璃效果
                            className={`flex-1 flex flex-col bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-sm ${isEditMode ? 'ring-2 ring-primary/20' : ''}`}
                        >
                            {/* 任务头部 */}
                            <div className="p-8 pb-4 flex-none">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-500 backdrop-blur-sm">
                                        <ListTodo className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-mono text-zinc-500 bg-white/40 px-3 py-1 rounded-full border border-white/20">
                                        {selectedDate.toISOString().split('T')[0]}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                                    待办事项
                                </h3>
                                <p className="text-sm text-zinc-500 mt-1 font-medium">
                                    {currentTasks.length > 0 ? `这里有 ${currentTasks.length} 个任务等你完成` : '今天暂无安排'}
                                </p>
                            </div>

                            {/* 分割线 */}
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-300/30 to-transparent flex-none" />

                            {/* 任务列表 (自适应高度) */}
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
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
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
                                                    <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-500 hover:bg-red-50/50 rounded-lg transition-all absolute right-2 bg-white/80 backdrop-blur">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* 底部输入框 (仅编辑模式) */}
                            {isEditMode && (
                                <div className="p-4 bg-white/30 backdrop-blur-md flex-none border-t border-white/20">
                                    <form onSubmit={handleAddTask} className="relative">
                                        <input
                                            type="text"
                                            value={newTask}
                                            onChange={(e) => setNewTask(e.target.value)}
                                            placeholder="输入任务..."
                                            className="w-full bg-white/70 border-none rounded-2xl py-3.5 pl-4 pr-12 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none shadow-inner"
                                        />
                                        <button type="submit" disabled={!newTask.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-xl disabled:opacity-50 hover:scale-105 transition-all shadow-lg shadow-primary/20">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* 右上角操作按钮 */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='fixed top-6 right-6 z-20 flex gap-3 max-sm:hidden'>
                {isEditMode ? (
                    <>
                        <button onClick={handleCancel} disabled={isSaving} className='flex items-center gap-2 rounded-full bg-white/40 dark:bg-black/40 px-5 py-2.5 text-sm font-medium backdrop-blur-md hover:bg-white/60 shadow-sm transition-all border border-white/20 text-zinc-600'>
                            <X className="w-4 h-4" /> 取消
                        </button>
                        <button onClick={handleSaveClick} disabled={isSaving} className='brand-btn px-6 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-primary/20 bg-primary text-white'>
                            <Save className="w-4 h-4" /> {isSaving ? '保存中...' : (isAuth ? '保存更新' : '导入密钥')}
                        </button>
                    </>
                ) : (
                    !hideEditButton && (
                        <button onClick={() => setIsEditMode(true)} className='flex items-center gap-2 rounded-full bg-white/40 dark:bg-black/40 px-5 py-2.5 text-sm font-medium backdrop-blur-md hover:bg-white/60 shadow-sm transition-all border border-white/20 text-zinc-600'>
                            <Edit3 className="w-4 h-4" /> 编辑日程
                        </button>
                    )
                )}
            </motion.div>
        </>
    )
}
