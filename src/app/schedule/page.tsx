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

            {/* 全局容器：使用透明背景，依赖全局 Layout 的背景图 */}
            <div className="min-h-screen w-full p-6 md:p-12 pt-28 flex justify-center items-start">
                
                {/* 顶部返回按钮 */}
                <div className='fixed top-6 left-6 z-20'>
                     <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-black/40 backdrop-blur-md shadow-sm border border-white/20 hover:scale-105 transition-all text-secondary hover:text-primary">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-medium text-sm">返回首页</span>
                    </Link>
                </div>

                {/* 核心布局：Grid 确保高度一致 */}
                <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[700px]">
                    
                    {/* === 左侧：日历卡片 (占8列) === */}
                    <div className="lg:col-span-8 h-full">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`h-full flex flex-col bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl p-8 shadow-sm transition-all ${isEditMode ? 'ring-2 ring-primary/20' : ''}`}
                        >
                            {/* 日历头部 */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/60 dark:bg-white/10 rounded-2xl shadow-sm text-primary">
                                        <CalendarIcon className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 font-mono tracking-tight">
                                            {currentDate.getFullYear()}
                                        </h2>
                                        <p className="text-zinc-500 font-medium text-lg ml-0.5">
                                            {currentDate.getMonth() + 1}月
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-white/50 dark:hover:bg-white/10 rounded-2xl transition-all text-zinc-600 dark:text-zinc-400">
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button onClick={() => changeMonth(1)} className="p-3 hover:bg-white/50 dark:hover:bg-white/10 rounded-2xl transition-all text-zinc-600 dark:text-zinc-400">
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* 星期表头 */}
                            <div className="grid grid-cols-7 mb-4">
                                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                                    <div key={d} className="text-center text-xs font-bold text-zinc-400 py-2 tracking-wider">{d}</div>
                                ))}
                            </div>

                            {/* 日期网格 - flex-1 确保填满剩余高度 */}
                            <div className="grid grid-cols-7 gap-4 flex-1 content-start">
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
                                                relative aspect-square rounded-2xl flex flex-col items-center justify-center text-lg transition-all duration-200
                                                ${isSelected 
                                                    ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105 font-bold' 
                                                    : 'hover:bg-white/60 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300'}
                                                ${isToday && !isSelected ? 'text-primary font-bold bg-primary/5' : ''}
                                            `}
                                        >
                                            {day}
                                            {status.has && (
                                                <div className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${
                                                    status.allDone ? 'bg-green-500' : (isSelected ? 'bg-white' : 'bg-primary')
                                                }`} />
                                            )}
                                        </motion.button>
                                    )
                                })}
                            </div>
                        </motion.div>
                    </div>

                    {/* === 右侧：任务长条 (占4列) === */}
                    <div className="lg:col-span-4 h-full">
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className={`h-full flex flex-col bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm ${isEditMode ? 'ring-2 ring-primary/20' : ''}`}
                        >
                            {/* 任务头部 */}
                            <div className="p-8 pb-4 flex-none">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-500">
                                        <ListTodo className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-mono text-zinc-400 bg-white/50 dark:bg-black/20 px-2 py-1 rounded-md">
                                        {selectedDate.toISOString().split('T')[0]}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                                    待办事项
                                </h3>
                                <p className="text-sm text-zinc-500 mt-1">
                                    {currentTasks.length > 0 ? `这里有 ${currentTasks.length} 个任务等你完成` : '今天暂无安排'}
                                </p>
                            </div>

                            {/* 装饰分割线 */}
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/50 dark:via-zinc-700 to-transparent flex-none" />

                            {/* 任务列表 (自适应高度，带滚动) */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                                <AnimatePresence mode='popLayout'>
                                    {currentTasks.length === 0 ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-zinc-400 gap-4 opacity-60">
                                            <Clock className="w-12 h-12 stroke-[1.5]" />
                                            <p className="text-sm">享受自由时光</p>
                                        </motion.div>
                                    ) : (
                                        currentTasks.map(task => (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                key={task.id}
                                                className={`group flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                                                    task.completed 
                                                        ? 'bg-zinc-100/50 dark:bg-zinc-800/30 border-transparent opacity-60 grayscale' 
                                                        : 'bg-white/80 dark:bg-zinc-800/80 border-white/50 dark:border-zinc-700 shadow-sm hover:shadow-md'
                                                }`}
                                            >
                                                <button 
                                                    onClick={() => toggleTask(task.id)}
                                                    disabled={!isEditMode}
                                                    className={`shrink-0 ${isEditMode ? 'cursor-pointer' : 'cursor-default'}`}
                                                >
                                                    {task.completed 
                                                        ? <CheckCircle2 className="w-6 h-6 text-green-500" /> 
                                                        : <Circle className="w-6 h-6 text-zinc-300 hover:text-primary transition-colors" />
                                                    }
                                                </button>
                                                <span className={`flex-1 text-sm font-medium ${task.completed ? 'line-through decoration-zinc-400' : 'text-zinc-700 dark:text-zinc-200'}`}>
                                                    {task.text}
                                                </span>
                                                {isEditMode && (
                                                    <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
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
                                <div className="p-4 bg-white/40 dark:bg-black/20 backdrop-blur-md flex-none border-t border-white/20">
                                    <form onSubmit={handleAddTask} className="relative">
                                        <input
                                            type="text"
                                            value={newTask}
                                            onChange={(e) => setNewTask(e.target.value)}
                                            placeholder="添加新任务..."
                                            className="w-full bg-white/80 dark:bg-zinc-800/80 border-none rounded-2xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none shadow-sm"
                                        />
                                        <button type="submit" disabled={!newTask.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-white rounded-xl disabled:opacity-50 hover:scale-105 transition-all shadow-lg shadow-primary/20">
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
                        <button onClick={handleCancel} disabled={isSaving} className='flex items-center gap-2 rounded-full bg-white/70 dark:bg-black/40 px-5 py-2.5 text-sm font-medium backdrop-blur-md hover:bg-white shadow-sm transition-all border border-white/20 text-zinc-600'>
                            <X className="w-4 h-4" /> 取消
                        </button>
                        <button onClick={handleSaveClick} disabled={isSaving} className='brand-btn px-6 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-primary/20'>
                            <Save className="w-4 h-4" /> {isSaving ? '保存中...' : (isAuth ? '保存更新' : '导入密钥')}
                        </button>
                    </>
                ) : (
                    !hideEditButton && (
                        <button onClick={() => setIsEditMode(true)} className='flex items-center gap-2 rounded-full bg-white/70 dark:bg-black/40 px-5 py-2.5 text-sm font-medium backdrop-blur-md hover:bg-white shadow-sm transition-all border border-white/20 text-zinc-600'>
                            <Edit3 className="w-4 h-4" /> 编辑日程
                        </button>
                    )
                )}
            </motion.div>
        </>
    )
}
