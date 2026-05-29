'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { toast } from 'sonner'
import { Check } from 'lucide-react'

dayjs.extend(weekOfYear)

import { useBlogIndex, type BlogIndexItem } from '@/hooks/use-blog-index'
import { useCategories } from '@/hooks/use-categories'
import { useReadArticles } from '@/hooks/use-read-articles'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { readFileAsText } from '@/lib/file-utils'
import { cn } from '@/lib/utils'
import { saveBlogEdits } from '@/app/blog/services/save-blog-edits'
import { CategoryModal } from '@/app/blog/components/category-modal'
import { BoardCard } from './board-card'
import { Timeline } from './timeline'
import { TagPanel } from './tag-panel'

export default function BoardPage() {
    const { boardItems: items, loading } = useBlogIndex()
    const { categories: categoriesFromServer } = useCategories()
    const { isRead } = useReadArticles()
    const { isAuth, setPrivateKey } = useAuthStore()
    const { siteContent } = useConfigStore()
    const hideEditButton = siteContent.hideEditButton ?? false
    const enableCategories = siteContent.enableCategories ?? false

    const keyInputRef = useRef<HTMLInputElement>(null)
    const groupRefs = useRef<Record<string, HTMLDivElement | null>>({})

    // --- tag filter state ---
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
    const [tagPanelOpen, setTagPanelOpen] = useState(false)
    const [activeGroup, setActiveGroup] = useState<string | null>(null)

    // --- edit mode state ---
    const [editMode, setEditMode] = useState(false)
    const [editableItems, setEditableItems] = useState<BlogIndexItem[]>([])
    const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set())
    const [saving, setSaving] = useState(false)
    const [categoryModalOpen, setCategoryModalOpen] = useState(false)
    const [categoryList, setCategoryList] = useState<string[]>([])
    const [newCategory, setNewCategory] = useState('')

    useEffect(() => {
        if (!editMode) setEditableItems(items)
    }, [items, editMode])

    useEffect(() => {
        setCategoryList(categoriesFromServer || [])
    }, [categoriesFromServer])

    // --- tag filtering ---
    const filteredItems = useMemo(() => {
        if (selectedTags.size === 0) return items
        return items.filter(item =>
            (item.tags || []).some(tag => selectedTags.has(tag))
        )
    }, [items, selectedTags])

    // --- time grouping for board ---
    const { groupedItems, groupKeys } = useMemo(() => {
        const sorted = [...filteredItems].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )

        const grouped = sorted.reduce(
            (acc, item) => {
                const key = dayjs(item.date).format('YYYY-MM')
                if (!acc[key]) {
                    acc[key] = { items: [], label: dayjs(key + '-01').format('YYYY年MM月') }
                }
                acc[key].items.push(item)
                return acc
            },
            {} as Record<string, { items: BlogIndexItem[]; label: string }>
        )

        return {
            groupedItems: grouped,
            groupKeys: Object.keys(grouped).sort((a, b) => b.localeCompare(a))
        }
    }, [filteredItems])

    // --- scroll to group ---
    const scrollToGroup = useCallback((key: string) => {
        setActiveGroup(key)
        const el = groupRefs.current[key]
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }, [])

    // --- edit mode handlers ---
    const toggleEditMode = useCallback(() => {
        if (editMode) {
            setEditMode(false)
            setEditableItems(items)
            setSelectedSlugs(new Set())
        } else {
            setEditableItems(items)
            setEditMode(true)
        }
    }, [editMode, items])

    const toggleSelect = useCallback((slug: string) => {
        setSelectedSlugs(prev => {
            const next = new Set(prev)
            if (next.has(slug)) next.delete(slug)
            else next.add(slug)
            return next
        })
    }, [])

    const handleSelectAll = useCallback(() => {
        setSelectedSlugs(new Set(editableItems.map(item => item.slug)))
    }, [editableItems])

    const handleDeselectAll = useCallback(() => {
        setSelectedSlugs(new Set())
    }, [])

    const handleSelectGroup = useCallback(
        (groupKey: string) => {
            const group = groupedItems[groupKey]
            if (!group) return
            const allSelected = group.items.every(item => selectedSlugs.has(item.slug))
            setSelectedSlugs(prev => {
                const next = new Set(prev)
                if (allSelected) {
                    group.items.forEach(item => next.delete(item.slug))
                } else {
                    group.items.forEach(item => next.add(item.slug))
                }
                return next
            })
        },
        [groupedItems, selectedSlugs]
    )

    const handleDeleteSelected = useCallback(() => {
        const count = selectedSlugs.size
        if (count === 0) {
            toast.info('请选择要删除的文章')
            return
        }
        setEditableItems(prev => prev.filter(item => !selectedSlugs.has(item.slug)))
        setSelectedSlugs(new Set())
    }, [selectedSlugs])

    const handleAssignCategory = useCallback((slug: string, category?: string) => {
        setEditableItems(prev =>
            prev.map(item => {
                if (item.slug !== slug) return item
                const next = category?.trim()
                if (!next) return { ...item, category: undefined }
                return { ...item, category: next }
            })
        )
    }, [])

    const handleAddCategory = useCallback(() => {
        const value = newCategory.trim()
        if (!value) { toast.info('请输入分类名称'); return }
        setCategoryList(prev => (prev.includes(value) ? prev : [...prev, value]))
        setNewCategory('')
    }, [newCategory])

    const handleRemoveCategory = useCallback((category: string) => {
        setCategoryList(prev => prev.filter(item => item !== category))
        setEditableItems(prev =>
            prev.map(item => (item.category === category ? { ...item, category: undefined } : item))
        )
    }, [])

    const handleReorderCategories = useCallback((nextList: string[]) => {
        setCategoryList(nextList)
    }, [])

    const handleCancel = useCallback(() => {
        setEditableItems(items)
        setSelectedSlugs(new Set())
        setEditMode(false)
    }, [items])

    const handleSave = useCallback(async () => {
        const removedSlugs = items
            .filter(item => !editableItems.some(e => e.slug === item.slug))
            .map(item => item.slug)
        const normalizedCategories = categoryList.map(c => c.trim()).filter(Boolean)
        const categoryListChanged =
            JSON.stringify(normalizedCategories) !==
            JSON.stringify((categoriesFromServer || []).map(c => c.trim()).filter(Boolean))
        const categoryAssignmentChanged = items.some(origin => {
            const next = editableItems.find(e => e.slug === origin.slug)
            return (origin.category || '') !== (next?.category || '')
        })
        const hasChanges = removedSlugs.length > 0 || categoryListChanged || categoryAssignmentChanged

        if (!hasChanges) { toast.info('没有需要保存的改动'); return }

        try {
            setSaving(true)
            await saveBlogEdits(items, editableItems, normalizedCategories)
            setEditMode(false)
            setSelectedSlugs(new Set())
            setCategoryModalOpen(false)
        } catch (error: any) {
            console.error(error)
            toast.error(error?.message || '保存失败')
        } finally {
            setSaving(false)
        }
    }, [items, editableItems, categoryList, categoriesFromServer])

    const handleSaveClick = useCallback(() => {
        if (!isAuth) { keyInputRef.current?.click(); return }
        void handleSave()
    }, [handleSave, isAuth])

    const handlePrivateKeySelection = useCallback(
        async (file: File) => {
            try {
                const pem = await readFileAsText(file)
                setPrivateKey(pem)
                toast.success('密钥导入成功，请再次点击保存')
            } catch (error) {
                console.error(error)
                toast.error('读取密钥失败')
            }
        },
        [setPrivateKey]
    )

    const handleItemClick = useCallback(
        (event: React.MouseEvent, slug: string) => {
            if (!editMode) return
            event.preventDefault()
            event.stopPropagation()
            toggleSelect(slug)
        },
        [editMode, toggleSelect]
    )

    // keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!editMode && (e.ctrlKey || e.metaKey) && e.key === ',') {
                e.preventDefault()
                toggleEditMode()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [editMode, toggleEditMode])

    const selectedCount = selectedSlugs.size

    return (
        <>
            <input
                ref={keyInputRef}
                type="file"
                accept=".pem"
                className="hidden"
                onChange={async e => {
                    const f = e.target.files?.[0]
                    if (f) await handlePrivateKeySelection(f)
                    if (e.currentTarget) e.currentTarget.value = ''
                }}
            />

            <div className="flex flex-col items-center px-4 md:px-6 pt-24 pb-12 min-h-screen">
                {/* Header */}
                <div className="mb-10 text-center">
                    <h1 className="font-averia text-4xl font-bold tracking-tight uppercase tracking-widest italic">
                        文章看板
                    </h1>
                    <div className="bg-brand mt-2 h-1 w-12 mx-auto rounded-full" />
                </div>

                {loading ? (
                    <div className="flex flex-col items-center gap-4 mt-20">
                        <div className="w-8 h-8 border-2 border-brand/30 border-t-brand animate-spin rounded-full" />
                        <p className="text-[10px] font-mono text-brand uppercase tracking-widest">
                            Loading Board...
                        </p>
                    </div>
                ) : (
                    /* Three-column layout */
                    <div className="w-full max-w-[1400px] flex gap-0">
                        {/* Left: Timeline */}
                        <aside className="hidden lg:block w-[200px] shrink-0 sticky top-28 self-start max-h-[calc(100vh-160px)] overflow-y-auto scrollbar-none pt-2">
                            <Timeline
                                items={filteredItems}
                                activeGroup={activeGroup}
                                onGroupClick={scrollToGroup}
                            />
                        </aside>

                        {/* Center: Board */}
                        <main className="flex-1 min-w-0 px-4 md:px-6">
                            {groupKeys.length > 0 ? (
                                <div className="flex flex-col gap-8">
                                    {groupKeys.map(key => {
                                        const group = groupedItems[key]
                                        if (!group) return null
                                        const groupAllSelected = group.items.every(
                                            item => selectedSlugs.has(item.slug)
                                        )
                                        return (
                                            <div
                                                key={key}
                                                ref={el => { groupRefs.current[key] = el }}
                                            >
                                                {/* Group header */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <h2 className="text-sm font-bold text-primary/80 tracking-wide">
                                                            {group.label}
                                                        </h2>
                                                        <span className="h-1 w-6 rounded-full bg-brand/40" />
                                                        <span className="text-[10px] text-secondary/50 font-mono">
                                                            {group.items.length}篇
                                                        </span>
                                                    </div>
                                                    {editMode && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => handleSelectGroup(key)}
                                                            className={cn(
                                                                'rounded-lg border px-3 py-1 text-xs transition-colors',
                                                                groupAllSelected
                                                                    ? 'border-brand/40 bg-brand/10 text-brand'
                                                                    : 'text-secondary hover:border-brand/40 hover:text-brand border-transparent bg-white/60'
                                                            )}
                                                        >
                                                            {groupAllSelected ? '取消全选' : '全选该组'}
                                                        </motion.button>
                                                    )}
                                                </div>

                                                {/* Cards */}
                                                <div className="flex flex-col gap-5">
                                                    {group.items.map((post, index) => {
                                                        const isSelected = selectedSlugs.has(post.slug)
                                                        return (
                                                            <div
                                                                key={post.slug}
                                                                className={cn(
                                                                    'relative transition-all duration-300',
                                                                    editMode && isSelected && 'ring-2 ring-brand/40 rounded-3xl'
                                                                )}
                                                            >
                                                                {editMode && (
                                                                    <button
                                                                        onClick={e => {
                                                                            e.preventDefault()
                                                                            e.stopPropagation()
                                                                            toggleSelect(post.slug)
                                                                        }}
                                                                        className={cn(
                                                                            'absolute top-3 right-3 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                                                                            isSelected
                                                                                ? 'bg-brand border-brand text-white'
                                                                                : 'bg-white/60 border-secondary/30 text-transparent hover:border-brand/50'
                                                                        )}
                                                                    >
                                                                        <Check className="w-3.5 h-3.5" />
                                                                    </button>
                                                                )}
                                                                <BoardCard
                                                                    post={post}
                                                                    index={index}
                                                                    isRead={isRead(post.slug)}
                                                                    editMode={editMode}
                                                                    onEditClick={handleItemClick}
                                                                />
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-20 opacity-20 italic">
                                    {selectedTags.size > 0 ? '没有匹配的文章' : 'No articles found.'}
                                </div>
                            )}
                        </main>

                        {/* Right: Tag Panel */}
                        <TagPanel
                            items={items}
                            selectedTags={selectedTags}
                            onTagsChange={setSelectedTags}
                            isOpen={tagPanelOpen}
                            onToggle={() => setTagPanelOpen(prev => !prev)}
                            matchedCount={filteredItems.length}
                        />
                    </div>
                )}
            </div>

            {/* Edit mode controls */}
            <AnimatePresence>
                {editMode && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="fixed top-16 right-6 z-50 flex items-center gap-3 mr-60"
                    >
                        {enableCategories && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setCategoryModalOpen(true)}
                                disabled={saving}
                                className="rounded-xl border bg-white/60 px-4 py-2 text-sm backdrop-blur-sm hover:bg-white/80"
                            >
                                分类
                            </motion.button>
                        )}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCancel}
                            disabled={saving}
                            className="rounded-xl border bg-white/60 px-6 py-2 text-sm backdrop-blur-sm"
                        >
                            取消
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={selectedCount === editableItems.length ? handleDeselectAll : handleSelectAll}
                            className="rounded-xl border bg-white/60 px-4 py-2 text-sm backdrop-blur-sm hover:bg-white/80"
                        >
                            {selectedCount === editableItems.length ? '取消全选' : '全选'}
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleDeleteSelected}
                            disabled={selectedCount === 0}
                            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 disabled:opacity-60"
                        >
                            删除({selectedCount}篇)
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSaveClick}
                            disabled={saving}
                            className="brand-btn px-6"
                        >
                            {saving ? '保存中...' : (isAuth ? '保存' : '导入密钥')}
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Non-edit: Edit button */}
            {!editMode && !hideEditButton && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleEditMode}
                    className="fixed top-16 left-6 z-50 rounded-xl border bg-white/60 backdrop-blur-sm px-6 py-2 text-sm hover:bg-white/80"
                >
                    编辑
                </motion.button>
            )}

            <CategoryModal
                open={categoryModalOpen}
                onClose={() => setCategoryModalOpen(false)}
                categoryList={categoryList}
                newCategory={newCategory}
                onNewCategoryChange={setNewCategory}
                onAddCategory={handleAddCategory}
                onRemoveCategory={handleRemoveCategory}
                onReorderCategories={handleReorderCategories}
                editableItems={editableItems}
                onAssignCategory={handleAssignCategory}
            />
        </>
    )
}
