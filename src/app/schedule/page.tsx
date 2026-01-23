'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
    ChevronLeft, ChevronRight, CheckCircle2, Circle, Plus, Trash2, 
    Calendar as CalendarIcon, Edit3, Save, X, ListTodo,
    Clock, ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import { useAuthStore } from '@/hooks/use-auth'
import { pushTasks } from './services/push-tasks'
import initialData from './tasks.json'

// --- 类型与工具 ---
type Task = { id: string; text: string; completed: boolean }
type TaskMap = Record<string, Task[]>

// 获取本地日期的 Key (YYYY-MM-DD)，避免时区偏移
const getLocalDateKey = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

export default function SchedulePage() {
    // --- 状态 ---
    const [mounted, setMounted] = useState(false)
    const { isAuth } = useAuthStore()
    
    // 数据初始化
    const safeData = (initialData || {}) as TaskMap
    const [tasks, setTasks] = useState<TaskMap>(safeData)
    const [originalData, setOriginalData] = useState<TaskMap>(safeData)
    
    // 日期状态 (初始化为 null，在 useEffect 中赋值以防水合错误)
    const [currentDate, setCurrentDate] = useState<Date>(new Date())
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [newTask, setNewTask] = useState('')
    
    const [isEditMode, setIsEditMode] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // --- 初始化 ---
    useEffect(() => {
        setMounted(true)
        const now = new Date()
        setCurrentDate(now)
        setSelectedDate(now)
    }, [])

    if (!mounted) return null // 防止水合闪烁

    // --- 日历核心逻辑 ---
    const getDaysArray = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1).getDay()
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        
        return Array.from({ length: 42 }, (_, i) => {
            const dayNum = i - firstDay + 1
            return (dayNum > 0 && dayNum <= daysInMonth) ? dayNum : null
        })
    }

    const daysArray = getDaysArray(currentDate)
    const selectedKey = getLocalDateKey(selectedDate)
    const currentTasks = tasks[selectedKey] || []

    // --- 操作处理 ---
    const handleSave = async () => {
        setIsSaving(true)
        try {
            await pushTasks(tasks)
            setOriginalData(tasks)
            setIsEditMode(false)
            toast.success('日程同步成功')
        } catch (error: any) {
            toast.error(`保存失败: ${error?.message || '未知错误'}`)
        } finally {
            setIsSaving(false)
        }
    }

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTask.trim()) return
        
        const id = typeof crypto !== 'undefined' && crypto.randomUUID 
            ? crypto.randomUUID() 
            : Math.random().toString(36).substring(2, 9)

        const task: Task = { id, text: newTask.trim(), completed: false }
        setTasks(prev => ({
            ...prev,
            [selectedKey]: [...(prev[selectedKey] || []), task]
        }))
        setNewTask('')
    }

    const toggleTask = (id: string) => {
        setTasks(prev => ({
            ...prev,
            [selectedKey]: prev[selectedKey].map(t => 
                t.id === id ? { ...t, completed: !t.completed } : t
            )
        }))
    }

    const deleteTask = (id: string) => {
        setTasks(prev => ({
            ...prev,
            [selectedKey]: prev[selectedKey].filter(t => t.id !== id)
        }))
    }

    return (
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-black p-4 md:p-8 pt-12">
            {/* 返回按钮 - 增加 mt-8 解决重叠 */}
            <div className="max-w-6xl mx-auto mb-8 mt-8">
                <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <ArrowLeft className="w-5 h-5" />
                    </div>
                    <span className="font-medium">返回首页</span>
                </Link>
            </div>

            <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 左侧：日历格子 (8列) */}
                <div className="lg:col-span-8 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/20 shadow-2xl overflow-hidden min-h-[600px]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">
                                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h2>
                        </div>
                        <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl">
                            <button 
                                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                                className="p-2 hover:bg-white dark:hover:bg-zinc-700 rounded-xl transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => {
                                    const now = new Date();
                                    setCurrentDate(now);
                                    setSelectedDate(now);
                                }}
                                className="px-4 py-2 text-sm font-medium hover:bg-white dark:hover:bg-zinc-700 rounded-xl transition-all"
                            >
                                今天
                            </button>
                            <button 
                                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                                className="p-2 hover:bg-white dark:hover:bg-zinc-700 rounded-xl transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-4">
                        {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                            <div key={d} className="text-center text-sm font-bold text-zinc-400 pb-4">{d}</div>
                        ))}
                        {daysArray.map((day, i) => {
                            if (!day) return <div key={i} />
                            
                            const thisDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                            const key = getLocalDateKey(thisDate)
                            const hasTasks = tasks[key]?.length > 0
                            const isSelected = selectedKey === key
                            const isToday = getLocalDateKey(new Date()) === key

                            return (
                                <button
                                    key={i}
                                    onClick={() => setSelectedDate(thisDate)}
                                    className={`
                                        aspect-square rounded-3xl flex flex-col items-center justify-center gap-1 transition-all relative group
                                        ${isSelected ? 'bg-zinc-900 text-white shadow-xl scale-105 z-10' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}
                                        ${isToday && !isSelected ? 'border-2 border-zinc-200 dark:border-zinc-700' : ''}
                                    `}
                                >
                                    <span className="text-lg font-semibold">{day}</span>
                                    {hasTasks && (
                                        <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500 animate-pulse'}`} />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* 右侧：任务详情 (4列) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-100 dark:border-zinc-800 shadow-xl flex-1 flex flex-col min-h-[600px]">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl">{selectedDate.getDate()} 日计划</h3>
                                    <p className="text-sm text-zinc-500 font-medium">
                                        {currentTasks.length} 个事项
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => isEditMode ? handleSave() : setIsEditMode(true)}
                                disabled={isSaving}
                                className={`p-3 rounded-2xl transition-all ${
                                    isEditMode 
                                    ? 'bg-green-500 text-white hover:bg-green-600' 
                                    : 'bg-zinc-100 dark:bg-zinc-800 hover:scale-110'
                                }`}
                            >
                                {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isEditMode ? <Save className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />)}
                            </button>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {currentTasks.map(task => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        key={task.id}
                                        className={`group flex items-center gap-3 p-4 rounded-3xl border transition-all ${
                                            task.completed 
                                            ? 'bg-zinc-50 dark:bg-zinc-800/50 border-transparent opacity-60' 
                                            : 'bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 shadow-sm'
                                        }`}
                                    >
                                        <button onClick={() => toggleTask(task.id)} className="shrink-0">
                                            {task.completed ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Circle className="w-6 h-6 text-zinc-300" />}
                                        </button>
                                        <span className={`flex-1 font-medium ${task.completed ? 'line-through text-zinc-400' : ''}`}>
                                            {task.text}
                                        </span>
                                        {isEditMode && (
                                            <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {isEditMode && (
                            <form onSubmit={handleAddTask} className="mt-6 flex gap-2">
                                <input
                                    type="text"
                                    value={newTask}
                                    onChange={(e) => setNewTask(e.target.value)}
                                    placeholder="添加新任务..."
                                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                />
                                <button type="submit" className="p-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl hover:scale-105 transition-all active:scale-95 shadow-lg">
                                    <Plus className="w-6 h-6" />
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
