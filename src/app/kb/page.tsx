'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { Star, BookOpen, Hash, Layers, Check } from 'lucide-react'
import Link from 'next/link'

import { useBlogIndex, type BlogIndexItem } from '@/hooks/use-blog-index'
import { useCategories } from '@/hooks/use-categories'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { readFileAsText } from '@/lib/file-utils'
import { cn } from '@/lib/utils'
import { saveBlogEdits } from '@/app/blog/services/save-blog-edits'
import { CategoryModal } from '@/app/blog/components/category-modal'
import { toggleOnBoard } from './services/toggle-on-board'

function countWords(md: string): number {
    const text = md.replace(/```[\s\S]*?```/g, '').replace(/[#*>\-`\[\]()!|{}]/g, ' ')
    const chinese = (text.match(/[一-鿿]/g) || []).length
    const english = (text.match(/[a-zA-Z]+/g) || []).length
    return chinese + english
}

function StatsBar({ total, wordCount, categories, selected }: {
    total: number; wordCount: number; categories: number; selected: number
}) {
    const stats = [
        { label: '文章总数', value: total, icon: BookOpen },
        { label: '总字数', value: wordCount.toLocaleString(), icon: Hash },
        { label: '分类数', value: categories, icon: Layers },
        { label: '精选文章', value: selected, icon: Star },
    ]
    return (
        <div className="flex items-center justify-center gap-0 rounded-2xl bg-white/30 backdrop-blur-xl border border-white/40 shadow-sm overflow-hidden max-w-2xl mx-auto">
            {stats.map((s, i) => (
                <div key={s.label} className={cn(
                    'flex items-center gap-3 px-8 py-4',
                    i < stats.length - 1 && 'border-r border-border/30'
                )}>
                    <s.icon className="w-5 h-5 text-brand/70" />
                    <div className="text-left">
                        <div className="text-[10px] font-bold text-secondary/50 uppercase tracking-widest">{s.label}</div>
                        <div className="text-xl font-bold text-primary">{s.value}</div>
                    </div>
                </div>
            ))}
        </div>
    )
}

function KbCard({ post, onToggle, editMode, isSelected, onSelect }: {
    post: BlogIndexItem
    onToggle: (slug: string) => void
    editMode?: boolean
    isSelected?: boolean
    onSelect?: (slug: string) => void
}) {
    const isOnBoard = post.onBoard !== false
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('group relative', editMode && isSelected && 'ring-2 ring-brand/40 rounded-2xl')}
        >
            <Link
                href={`/blog/${post.slug}`}
                onClick={editMode ? (e) => { e.preventDefault(); onSelect?.(post.slug) } : undefined}
                className="flex flex-col overflow-hidden rounded-2xl bg-card border shadow-sm hover:shadow-lg hover:border-brand/30 transition-all duration-300 h-full"
            >
                {post.cover && (
                    <div className="relative h-36 overflow-hidden bg-secondary/5">
                        <img src={post.cover} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                )}
                <div className="flex-1 flex flex-col p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-widest uppercase bg-brand/10 text-brand rounded">
                            {post.category || '未分类'}
                        </span>
                        <span className="text-[10px] text-secondary/50 font-mono">{dayjs(post.date).format('YYYY-MM-DD')}</span>
                    </div>
                    <h3 className="font-averia text-base font-bold group-hover:text-brand transition-colors line-clamp-2 mb-2 italic">
                        {post.title}
                    </h3>
                    <p className="text-xs text-secondary/60 line-clamp-2 leading-relaxed">
                        {post.summary || '暂无摘要'}
                    </p>
                </div>
            </Link>

            {editMode ? (
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelect?.(post.slug) }}
                    className={cn(
                        'absolute top-2 right-2 z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors',
                        isSelected
                            ? 'bg-brand border-brand text-white'
                            : 'bg-white/60 border-secondary/30 text-transparent hover:border-brand/50'
                    )}
                >
                    <Check className="w-4 h-4" />
                </button>
            ) : (
                <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(post.slug) }}
                    className={cn(
                        'absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border shadow-sm transition-colors',
                        isOnBoard
                            ? 'bg-brand/90 border-brand text-white'
                            : 'bg-white/60 border-white/40 text-secondary/40 hover:text-brand hover:border-brand/30'
                    )}
                    title={isOnBoard ? '从看板移除' : '精选到看板'}
                >
                    <Star className={cn('w-4 h-4 transition-all', isOnBoard && 'fill-white')} />
                </motion.button>
            )}
        </motion.div>
    )
}

function TocNav({ categories, activeCat, onSelect }: {
    categories: { label: string; count: number; key: string }[]
    activeCat: string | null
    onSelect: (key: string) => void
}) {
    return (
        <nav className="flex flex-col gap-1">
            <div className="text-[10px] font-bold tracking-widest uppercase text-secondary/50 px-3 mb-2">分类目录</div>
            {categories.map(({ label, count, key }) => {
                const isActive = activeCat === key
                return (
                    <motion.button
                        key={key}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onSelect(key)}
                        className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-sm',
                            isActive ? 'bg-brand/10 text-brand font-bold' : 'text-secondary/70 hover:text-primary hover:bg-white/40'
                        )}
                    >
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0 transition-all', isActive ? 'bg-brand' : 'bg-secondary/30')} />
                        <span className="flex-1">{label}</span>
                        <span className={cn('text-xs', isActive ? 'text-brand/60' : 'text-secondary/40')}>{count}</span>
                    </motion.button>
                )
            })}
        </nav>
    )
}

export default function KbPage() {
    const { items, loading } = useBlogIndex()
    const { categories: categoriesFromServer } = useCategories()
    const { isAuth, setPrivateKey } = useAuthStore()
    const { siteContent } = useConfigStore()
    const hideEditButton = siteContent.hideEditButton ?? false
    const enableCategories = siteContent.enableCategories ?? false

    const keyInputRef = useRef<HTMLInputElement>(null)
    const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({})

    const [localItems, setLocalItems] = useState<BlogIndexItem[]>([])
    const [wordCounts, setWordCounts] = useState<Record<string, number>>({})
    const [activeCat, setActiveCat] = useState<string | null>(null)

    // edit mode
    const [editMode, setEditMode] = useState(false)
    const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set())
    const [saving, setSaving] = useState(false)
    const [categoryModalOpen, setCategoryModalOpen] = useState(false)
    const [categoryList, setCategoryList] = useState<string[]>([])
    const [newCategory, setNewCategory] = useState('')

    useEffect(() => { if (!editMode) setLocalItems(items) }, [items, editMode])
    useEffect(() => { setCategoryList(categoriesFromServer || []) }, [categoriesFromServer])

    // word count
    useEffect(() => {
        if (items.length === 0) return
        items.forEach(async (item) => {
            if (wordCounts[item.slug] !== undefined) return
            try {
                const res = await fetch(`/blogs/${item.slug}/index.md`)
                if (!res.ok) return
                const md = await res.text()
                setWordCounts(prev => ({ ...prev, [item.slug]: countWords(md) }))
            } catch { /* ignore */ }
        })
    }, [items])

    const categories = useMemo(() => {
        const map: Record<string, BlogIndexItem[]> = {}
        const source = editMode ? localItems : localItems
        source.forEach(item => {
            const cat = item.category || '未分类'
            if (!map[cat]) map[cat] = []
            map[cat].push(item)
        })
        return Object.entries(map)
            .sort(([, a], [, b]) => b.length - a.length)
            .map(([cat, catItems]) => ({
                key: cat,
                label: cat,
                count: catItems.length,
                items: catItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            }))
    }, [localItems, editMode])

    const totalWords = useMemo(() => Object.values(wordCounts).reduce((sum, n) => sum + n, 0), [wordCounts])
    const selectedCount = localItems.filter(i => i.onBoard !== false).length
    const uniqueCatCount = categories.length

    const scrollToCat = useCallback((key: string) => {
        setActiveCat(key)
        const el = categoryRefs.current[key]
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, [])

    const handleToggle = useCallback(async (slug: string) => {
        const item = localItems.find(i => i.slug === slug)
        const willBeOnBoard = !(item?.onBoard !== false)
        setLocalItems(prev => prev.map(i => i.slug === slug ? { ...i, onBoard: !(i.onBoard !== false) } : i))
        try {
            await toggleOnBoard(localItems, slug)
            toast.success(willBeOnBoard ? '已添加到文章看板' : '已从文章看板移除')
        } catch (error: any) {
            setLocalItems(prev => prev.map(i => i.slug === slug ? { ...i, onBoard: !(i.onBoard !== false) } : i))
            toast.error(error?.message || '操作失败')
        }
    }, [localItems])

    // --- edit mode handlers ---
    const toggleEditMode = useCallback(() => {
        if (editMode) { setEditMode(false); setSelectedSlugs(new Set()) }
        else { setLocalItems(items); setEditMode(true) }
    }, [editMode, items])

    const toggleSelect = useCallback((slug: string) => {
        setSelectedSlugs(prev => { const next = new Set(prev); if (next.has(slug)) next.delete(slug); else next.add(slug); return next })
    }, [])

    const handleSelectAll = useCallback(() => setSelectedSlugs(new Set(localItems.map(i => i.slug))), [localItems])
    const handleDeselectAll = useCallback(() => setSelectedSlugs(new Set()), [])

    const handleDeleteSelected = useCallback(() => {
        if (selectedSlugs.size === 0) { toast.info('请选择要删除的文章'); return }
        setLocalItems(prev => prev.filter(i => !selectedSlugs.has(i.slug)))
        setSelectedSlugs(new Set())
    }, [selectedSlugs])

    const handleAssignCategory = useCallback((slug: string, category?: string) => {
        setLocalItems(prev => prev.map(item => {
            if (item.slug !== slug) return item
            const next = category?.trim()
            if (!next) return { ...item, category: undefined }
            return { ...item, category: next }
        }))
    }, [])

    const handleAddCategory = useCallback(() => {
        const v = newCategory.trim()
        if (!v) { toast.info('请输入分类名称'); return }
        setCategoryList(prev => prev.includes(v) ? prev : [...prev, v])
        setNewCategory('')
    }, [newCategory])

    const handleRemoveCategory = useCallback((cat: string) => {
        setCategoryList(prev => prev.filter(c => c !== cat))
        setLocalItems(prev => prev.map(i => i.category === cat ? { ...i, category: undefined } : i))
    }, [])

    const handleReorderCategories = useCallback((next: string[]) => setCategoryList(next), [])

    const handleCancel = useCallback(() => {
        setLocalItems(items)
        setSelectedSlugs(new Set())
        setEditMode(false)
    }, [items])

    const handleSave = useCallback(async () => {
        const removedSlugs = items.filter(i => !localItems.some(e => e.slug === i.slug)).map(i => i.slug)
        const normalized = categoryList.map(c => c.trim()).filter(Boolean)
        const catListChanged = JSON.stringify(normalized) !== JSON.stringify((categoriesFromServer || []).map(c => c.trim()).filter(Boolean))
        const catAssignChanged = items.some(o => {
            const n = localItems.find(e => e.slug === o.slug)
            return (o.category || '') !== (n?.category || '')
        })
        const hasChanges = removedSlugs.length > 0 || catListChanged || catAssignChanged
        if (!hasChanges) { toast.info('没有需要保存的改动'); return }
        try {
            setSaving(true)
            await saveBlogEdits(items, localItems, normalized)
            setEditMode(false)
            setSelectedSlugs(new Set())
            setCategoryModalOpen(false)
        } catch (error: any) {
            console.error(error)
            toast.error(error?.message || '保存失败')
        } finally { setSaving(false) }
    }, [items, localItems, categoryList, categoriesFromServer])

    const handleSaveClick = useCallback(() => {
        if (!isAuth) { keyInputRef.current?.click(); return }
        void handleSave()
    }, [handleSave, isAuth])

    const handlePrivateKeySelection = useCallback(async (file: File) => {
        try {
            const pem = await readFileAsText(file)
            setPrivateKey(pem)
            toast.success('密钥导入成功，请再次点击保存')
        } catch (error) { console.error(error); toast.error('读取密钥失败') }
    }, [setPrivateKey])

    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (!editMode && (e.ctrlKey || e.metaKey) && e.key === ',') { e.preventDefault(); toggleEditMode() } }
        window.addEventListener('keydown', h)
        return () => window.removeEventListener('keydown', h)
    }, [editMode, toggleEditMode])

    const slugCount = selectedSlugs.size

    return (
        <>
            <input ref={keyInputRef} type="file" accept=".pem" className="hidden" onChange={async e => {
                const f = e.target.files?.[0]
                if (f) await handlePrivateKeySelection(f)
                if (e.currentTarget) e.currentTarget.value = ''
            }} />

            <div className="flex flex-col items-center px-4 md:px-6 pt-24 pb-12 min-h-screen">
                <div className="mb-8 text-center">
                    <h1 className="font-averia text-4xl font-bold tracking-tight uppercase tracking-widest italic">知识库</h1>
                    <div className="bg-brand mt-2 h-1 w-12 mx-auto rounded-full" />
                </div>

                {loading ? (
                    <div className="flex flex-col items-center gap-4 mt-20">
                        <div className="w-8 h-8 border-2 border-brand/30 border-t-brand animate-spin rounded-full" />
                        <p className="text-[10px] font-mono text-brand uppercase tracking-widest">Loading...</p>
                    </div>
                ) : (
                    <>
                        <StatsBar total={localItems.length} wordCount={totalWords} categories={uniqueCatCount} selected={selectedCount} />

                        <div className="w-full max-w-[1200px] flex gap-10 mt-10">
                            <div className="flex-1 min-w-0">
                                {categories.length > 0 ? (
                                    <div className="flex flex-col gap-12">
                                        {categories.map(({ key, label, count, items: catItems }) => (
                                            <div key={key} ref={el => { categoryRefs.current[key] = el }}>
                                                <div className="flex items-center gap-3 mb-5">
                                                    <h2 className="font-averia text-2xl font-bold italic text-primary">{label}</h2>
                                                    <span className="h-1 w-8 rounded-full bg-brand/40" />
                                                    <span className="text-xs text-secondary/50 font-mono">{count}篇</span>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                                    {catItems.map(post => (
                                                        <KbCard
                                                            key={post.slug}
                                                            post={post}
                                                            onToggle={handleToggle}
                                                            editMode={editMode}
                                                            isSelected={selectedSlugs.has(post.slug)}
                                                            onSelect={toggleSelect}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 opacity-20 italic">暂无文章</div>
                                )}
                            </div>

                            <aside className="hidden xl:block w-[180px] shrink-0 sticky top-28 self-start max-h-[calc(100vh-160px)] overflow-y-auto scrollbar-none pt-2">
                                <TocNav
                                    categories={categories.map(({ key, label, count }) => ({ key, label, count }))}
                                    activeCat={activeCat}
                                    onSelect={scrollToCat}
                                />
                            </aside>
                        </div>
                    </>
                )}
            </div>

            {/* Edit controls */}
            <AnimatePresence>
                {editMode && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="fixed top-16 right-6 z-50 flex items-center gap-3">
                        {enableCategories && (
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setCategoryModalOpen(true)} disabled={saving} className="rounded-xl border bg-white/60 px-4 py-2 text-sm backdrop-blur-sm hover:bg-white/80">分类</motion.button>
                        )}
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCancel} disabled={saving} className="rounded-xl border bg-white/60 px-6 py-2 text-sm backdrop-blur-sm">取消</motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={slugCount === localItems.length ? handleDeselectAll : handleSelectAll} className="rounded-xl border bg-white/60 px-4 py-2 text-sm backdrop-blur-sm hover:bg-white/80">{slugCount === localItems.length ? '取消全选' : '全选'}</motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleDeleteSelected} disabled={slugCount === 0} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 disabled:opacity-60">删除({slugCount}篇)</motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSaveClick} disabled={saving} className="brand-btn px-6">{saving ? '保存中...' : (isAuth ? '保存' : '导入密钥')}</motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {!editMode && !hideEditButton && (
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggleEditMode} className="fixed top-16 right-6 z-50 rounded-xl border bg-white/60 backdrop-blur-sm px-6 py-2 text-sm hover:bg-white/80">编辑</motion.button>
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
                editableItems={localItems}
                onAssignCategory={handleAssignCategory}
            />
        </>
    )
}
