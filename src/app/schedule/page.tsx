'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { 
    ChevronLeft, ChevronRight, CheckCircle2, Circle, Plus, Trash2, 
    ArrowLeft, Calendar as CalendarIcon, Edit3, Save, X, Lock 
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
    // 使用 JSON 文件作为初始值
    const [tasks, setTasks] = useState<TaskMap>(initialData as TaskMap)
    const [originalData, setOriginalData] = useState<TaskMap>(initialData as TaskMap)
    
    const [currentDate, setCurrentDate] = useState(new Date()) // 当前月份
    const [selectedDate, setSelectedDate] = useState(new Date()) // 选中日期
    const [newTask, setNewTask] = useState('')
    
    // 编辑模式相关
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
			setOriginalData(tasks) // 更新快照
			setIsEditMode(false)
		} catch (error: any) {
			toast.error(`保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

    const handleCancel = () => {
		setTasks(originalData) // 恢复到上次保存的状态
		setIsEditMode(false)
        toast.info('已取消更改')
	}

    // --- 任务操作 (仅在编辑模式下生效) ---
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
        if (!isEditMode) return // 非编辑模式不可点击
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

    // 快捷键支持
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

    // 获取某天任务状态
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

            <div className="min-h-screen bg-[#F8F9FA] dark:bg-black text-foreground p-4 md:p-8 pt-24 flex justify-center">
                <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-6 h-fit">
                    
                    {/* 左侧：日历 */}
                    <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <Link href="/" className="flex items-center gap-2 text-secondary hover:text-primary transition-colors group">
                                <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 border shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <ArrowLeft className="w-4 h-4" />
                                </div>
                                <span className="font-medium">返回首页</span>
                            </Link>
                        </div>

                        <div className={`card bg-white dark:bg-zinc-900/50 border p-6 md:p-8 rounded-2xl shadow-sm backdrop-blur-xl relative overflow-hidden transition-colors ${isEditMode ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}>
                            {/* 编辑模式提示条 */}
                            {isEditMode && (
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-purple-500/50" />
                            )}

                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-3xl font-bold tracking-tight">
                                    {currentDate.getFullYear()}年 
                                    <span className="text-primary ml-2">{currentDate.getMonth() + 1}月</span>
                                </h2>
                                <div className="flex gap-2">
                                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><ChevronLeft className="w-6 h-6" /></button>
                                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><ChevronRight className="w-6 h-6" /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 mb-4">
                                {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                                    <div key={d} className="text-center text-sm font-medium text-secondary py-2">{d}</div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-2 md:gap-4">
                                {daysArray.map((day, i) => {
                                    if (!day) return <div key={i} />
                                    const isSelected = day === selectedDate.getDate() && currentDate.getMonth() === selectedDate.getMonth()
                                    const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear()
                                    const status = getDayStatus(day)

                                    return (
                                        <motion.button
                                            key={i}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                                            className={`
                                                relative aspect-square rounded-2xl flex flex-col items-center justify-center text-lg font-medium transition-all
                                                ${isSelected 
                                                    ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                                                    : 'bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent hover:border-border'}
                                                ${isToday && !isSelected ? 'text-primary border-primary/30 bg-primary/5' : ''}
                                            `}
                                        >
                                            {day}
                                            {status.has && (
                                                <div className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${status.allDone ? 'bg-green-400' : (isSelected ? 'bg-white/80' : 'bg-primary')}`} />
                                            )}
                                            {isToday && !isSelected && <span className="absolute top-2 right-2 text-[10px] font-bold text-primary">今</span>}
                                        </motion.button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* 右侧：任务面板 */}
                    <div className="md:col-span-5 lg:col-span-4 h-full">
                        <div className={`card bg-white dark:bg-zinc-900/50 border h-full rounded-2xl shadow-sm backdrop-blur-xl flex flex-col overflow-hidden transition-all ${isEditMode ? 'border-primary/50' : ''}`}>
                            <div className="p-6 border-b bg-zinc-50/50 dark:bg-zinc-800/20">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                        <CalendarIcon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold">
                                        {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日
                                    </h3>
                                </div>
                                <p className="text-secondary text-sm ml-10">
                                    {isEditMode ? '编辑模式' : '预览模式'} · {currentTasks.length} 个任务
                                </p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                                <AnimatePresence initial={false} mode='popLayout'>
                                    {currentTasks.length === 0 ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-secondary space-y-4 min-h-[300px]">
                                            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                                                <CheckCircle2 className="w-8 h-8 opacity-20" />
                                            </div>
                                            <p>{isEditMode ? '暂无任务，快添加一个吧！' : '今天没有安排任务 ~'}</p>
                                        </motion.div>
                                    ) : (
                                        currentTasks.map(task => (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                key={task.id}
                                                className={`group flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                                    task.completed 
                                                        ? 'bg-zinc-50 dark:bg-zinc-900 border-transparent opacity-60' 
                                                        : 'bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 shadow-sm'
                                                }`}
                                            >
                                                <button 
                                                    onClick={() => toggleTask(task.id)}
                                                    disabled={!isEditMode}
                                                    className={`shrink-0 transition-colors ${task.completed ? 'text-green-500' : 'text-zinc-300'} ${isEditMode ? 'hover:text-primary cursor-pointer' : 'cursor-default'}`}
                                                >
                                                    {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                                </button>
                                                <span className={`flex-1 text-sm font-medium ${task.completed ? 'line-through text-secondary' : ''}`}>
                                                    {task.text}
                                                </span>
                                                {isEditMode && (
                                                    <button onClick={() => deleteTask(task.id)} className="text-red-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* 仅在编辑模式显示输入框 */}
                            {isEditMode && (
                                <div className="p-4 border-t bg-white dark:bg-zinc-900 z-10">
                                    <form onSubmit={handleAddTask} className="relative">
                                        <input
                                            type="text"
                                            value={newTask}
                                            onChange={(e) => setNewTask(e.target.value)}
                                            placeholder="添加新任务..."
                                            autoFocus
                                            className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        />
                                        <button type="submit" disabled={!newTask.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-white rounded-lg disabled:opacity-50 hover:scale-105 transition-all">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            )}
                            
                            {!isEditMode && currentTasks.length > 0 && (
                                <div className="p-4 border-t bg-zinc-50/50 dark:bg-zinc-900/50 text-center text-xs text-secondary">
                                    点击右上角编辑按钮进行管理
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 右上角悬浮操作栏 */}
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className='fixed top-4 right-6 z-20 flex gap-3 max-sm:hidden'>
				{isEditMode ? (
					<>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={handleCancel}
							disabled={isSaving}
							className='flex items-center gap-2 rounded-xl border bg-white/80 px-4 py-2 text-sm shadow-sm backdrop-blur dark:bg-zinc-800/80 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'>
							<X className="w-4 h-4" /> 取消
						</motion.button>
						<motion.button 
                            whileHover={{ scale: 1.05 }} 
                            whileTap={{ scale: 0.95 }} 
                            onClick={handleSaveClick} 
                            disabled={isSaving} 
                            className='brand-btn px-6 flex items-center gap-2 shadow-md'
                        >
							<Save className="w-4 h-4" />
							{isSaving ? '保存中...' : buttonText}
						</motion.button>
					</>
				) : (
					!hideEditButton && (
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => setIsEditMode(true)}
							className='flex items-center gap-2 rounded-xl border bg-white/60 px-4 py-2 text-sm backdrop-blur-md transition-colors hover:bg-white/90 shadow-sm dark:bg-zinc-800/60'>
							<Edit3 className="w-4 h-4" /> 编辑日程
						</motion.button>
					)
				)}
			</motion.div>
        </>
    )
}
