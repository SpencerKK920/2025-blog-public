'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
    ChevronLeft, ChevronRight, CheckCircle2, Circle, Plus, Trash2, 
    Calendar as CalendarIcon, Edit3, Save, X, ListTodo,
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
