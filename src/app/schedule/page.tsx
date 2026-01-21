'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { 
    ChevronLeft, ChevronRight, CheckCircle2, Circle, Plus, Trash2, 
    ArrowLeft, Calendar as CalendarIcon, Edit3, Save, X, ListTodo
} from 'lucide-react'
import { toast } from 'sonner'

import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { pushTasks } from './services/push-tasks'
import initialData from './tasks.json'

// 类型定义
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

    // --- 日历核心逻辑 ---
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

    // --- 权限与保存逻辑 ---
    const handleChoosePrivateKey = async (file: File) => {
        try {
            const text = await file.text()
            setPrivateKey(text)
            toast.success('密钥读取成功')
        } catch (error) {
            console.error('Failed to read private key:', error)
            toast.error('读取密钥文件失败')
        }
    }

    const handleSaveClick = () => {
        if (!isAuth) {
            keyInputRef.current?.click()
        } else {
            handleSave()
        }
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

        const task: Task = {
            id: crypto.randomUUID(),
            text: newTask.trim(),
            completed: false
        }

        setTasks(prev => ({
            ...prev,
            [dateKey]: [...(prev[dateKey] || []), task]
        }))
        setNewTask('')
    }

    const toggleTask = (taskId: string) => {
        if (!isEditMode) return
        setTasks(prev => ({
            ...prev,
            [dateKey]: prev[dateKey].map(t => 
                t.id === taskId ? { ...t, completed: !t.completed } : t
            )
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

    const buttonText = isAuth ? '保存更新' : '导入密钥'

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
            <input
                ref={keyInputRef}
                type='file'
                accept='.pem'
                className='hidden'
                onChange={async e => {
                    const f = e.target.files?.[0]
                    if (f) await handleChoosePrivateKey(f)
                    if (e.currentTarget) e.currentTarget.value = ''
                }}
            />

            {/* 顶部导航栏 */}
            <div className='fixed top-6 left-6 z-20'>
                 <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md shadow-sm hover:shadow-md transition-all text-secondary hover:text-primary border border-white/20">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="font-medium text-sm">返回首页</span>
                </Link>
            </div>

            <div className="min-h-screen bg-[#F2F1ED] dark:bg-zinc-950 text-foreground p-4 md:p-8 pt-24 flex justify-center items-start">
                <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    
                    {/* 左侧：日历大方块 (占8列) */}
                    <div className="lg:col-span-8 flex flex-col h-full">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex-1 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/50 dark:border-zinc-800 p-8 rounded-3xl shadow-sm transition-all ${isEditMode ? 'ring-2 ring-primary/20' : ''}`}
                        >
                            {/* 标题栏 */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-red-500/10 rounded-xl text-red-500">
                                        <CalendarIcon className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                                        {currentDate.getFullYear()}年 
                                        <span className="ml-2">{currentDate.getMonth() + 1}月</span>
                                    </h2>
                                </div>
                                
                                <div className="flex gap-2">
                                    <button onClick={() => changeMonth(-1)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm transition-all text-secondary">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => changeMonth(1)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm transition-all text-secondary">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* 星期头 */}
                            <div className="grid grid-cols-7 mb-4">
                                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                                    <div key={d} className="text-center text-xs font-bold tracking-wider text-zinc-400 py-3">{d}</div>
                                ))}
                            </div>

                            {/* 日期网格 */}
                            <div className="grid grid-cols-7 gap-3 h-full content-start">
                                {daysArray.map((day, i) => {
                                    if (!day) return <div key={i} className="aspect-square" /> // 占位
                                    const isSelected = day === selectedDate.getDate() && currentDate.getMonth() === selectedDate.getMonth()
                                    const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear()
                                    const status = getDayStatus(day)

                                    return (
                                        <motion.button
                                            key={i}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                                            className={`
                                                aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300
                                                ${isSelected 
                                                    ? 'bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg scale-105 z-10' 
                                                    : 'hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}
                                                ${isToday && !isSelected ? 'text-red-500 font-bold bg-red-50 dark:bg-red-900/10' : ''}
                                            `}
                                        >
                                            <span className={`text-lg ${isSelected ? 'font-bold' : 'font-medium'}`}>{day}</span>
                                            
                                            {/* 状态点 */}
                                            {status.has && (
                                                <div className={`absolute bottom-3 w-1.5 h-1.5 rounded-full ${
                                                    status.allDone 
                                                        ? 'bg-green-500' 
                                                        : (isSelected ? 'bg-white/50 dark:bg-black/50' : 'bg-red-500')
                                                }`} />
                                            )}
                                        </motion.button>
                                    )
                                })}
                            </div>
                        </motion.div>
                    </div>

                    {/* 右侧：任务长框 (占4列，高度自动填满) */}
                    <div className="lg:col-span-4 flex flex-col h-full">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className={`flex flex-col h-full min-h-[500px] bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/50 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden ${isEditMode ? 'ring-2 ring-primary/20' : ''}`}
                        >
                            {/* 任务头 */}
                            <div className="p-8 pb-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500">
                                        <ListTodo className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
                                        {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日
                                    </h3>
                                </div>
                                <div className="pl-12 text-sm text-zinc-400 font-medium">
                                    {isEditMode ? '正在编辑中...' : `${currentTasks.length} 个待办事项`}
                                </div>
                            </div>
                            
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-700 to-transparent my-2" />

                            {/* 列表区域 */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                                <AnimatePresence initial={false} mode='popLayout'>
                                    {currentTasks.length === 0 ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-600 gap-4">
                                            <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center">
                                                <CheckCircle2 className="w-10 h-10 opacity-50" />
                                            </div>
                                            <p className="text-sm font-medium">今日无安排，享受生活吧</p>
                                        </motion.div>
                                    ) : (
                                        currentTasks.map((task, idx) => (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ delay: idx * 0.05 }}
                                                key={task.id}
                                                className={`group relative flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${
                                                    task.completed 
                                                        ? 'bg-zinc-50/50 dark:bg-zinc-800/30 border-transparent opacity-60' 
                                                        : 'bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 shadow-sm hover:shadow-md'
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
                                                
                                                <span className={`flex-1 text-sm font-medium leading-relaxed ${task.completed ? 'line-through text-zinc-400' : 'text-zinc-700 dark:text-zinc-200'}`}>
                                                    {task.text}
                                                </span>

                                                {isEditMode && (
                                                    <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 absolute right-2 p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* 编辑输入框 (固定在底部) */}
                            {isEditMode && (
                                <div className="p-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border-t border-zinc-100 dark:border-zinc-800">
                                    <form onSubmit={handleAddTask} className="relative group">
                                        <input
                                            type="text"
                                            value={newTask}
                                            onChange={(e) => setNewTask(e.target.value)}
                                            placeholder="输入任务，按回车添加..."
                                            autoFocus
                                            className="w-full bg-zinc-100 dark:bg-zinc-800 border-transparent focus:border-primary/30 rounded-2xl py-3.5 pl-5 pr-12 text-sm focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        />
                                        <button type="submit" disabled={!newTask.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-primary text-white rounded-xl disabled:opacity-50 disabled:bg-zinc-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30 transition-all">
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </form>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* 右上角控制按钮 */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className='fixed top-6 right-6 z-20 flex gap-3 max-sm:hidden'>
                {isEditMode ? (
                    <>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCancel}
                            disabled={isSaving}
                            className='flex items-center gap-2 rounded-full border border-white/20 bg-white/80 dark:bg-zinc-800/80 px-5 py-2.5 text-sm font-medium shadow-sm backdrop-blur hover:bg-white transition-all text-zinc-600 dark:text-zinc-300'>
                            <X className="w-4 h-4" /> 取消
                        </motion.button>
                        <motion.button 
                            whileHover={{ scale: 1.05 }} 
                            whileTap={{ scale: 0.95 }} 
                            onClick={handleSaveClick} 
                            disabled={isSaving} 
                            className='brand-btn px-6 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-primary/20 font-medium'
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? '正在保存...' : buttonText}
                        </motion.button>
                    </>
                ) : (
                    !hideEditButton && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsEditMode(true)}
                            className='flex items-center gap-2 rounded-full border border-white/20 bg-white/60 dark:bg-zinc-800/60 px-5 py-2.5 text-sm font-medium backdrop-blur-md transition-all hover:bg-white hover:shadow-md text-zinc-600 dark:text-zinc-300'>
                            <Edit3 className="w-4 h-4" /> 编辑日程
                        </motion.button>
                    )
                )}
            </motion.div>
        </>
    )
}
