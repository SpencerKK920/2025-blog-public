'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { useMarkdownRender } from '@/hooks/use-markdown-render'
import { pushAbout, type AboutData } from './services/push-about'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import LikeButton from '@/components/like-button'

// === 1. 图标库引入 (只保留稳定版本) ===
import { 
    User, Cpu, History, Edit3, Eye, Save, X 
} from 'lucide-react' 

import { 
    FaLinux, FaReact, FaDocker, FaGitAlt, FaNodeJs, FaPython, FaJava, FaUbuntu, FaRust, FaPhp, FaAws, FaFigma, FaAndroid, FaApple
} from 'react-icons/fa'

// 移除报错的图标，只保留最常用的
import { 
    SiNextdotjs, SiTypescript, SiTailwindcss, SiNginx, SiRedis, SiMongodb, SiMysql, 
    SiPostgresql, SiVercel, SiCloudflare, SiJavascript, SiHtml5, SiCss3, SiKubernetes,
    SiVuedotjs, SiGo, SiSvelte, SiAngular, SiKotlin,
    SiSupabase, SiFirebase, SiPrisma, SiExpress, SiVite, 
    SiFlutter, SiGithub, SiNotion, SiPostman, SiIntellijidea
} from 'react-icons/si'

// 引入 VS Code 官方图标
import { VscTerminalLinux, VscVscode } from "react-icons/vsc"
import GithubSVG from '@/svgs/github.svg'
import initialData from './list.json'

// === 2. 图标数据定义 ===
type TechIconDef = {
    id: string; label: string; icon: any; color: string; bg: string; category: string;
}

const ALL_ICONS: TechIconDef[] = [
    // --- 语言 ---
    { id: 'ts', label: 'TypeScript', icon: SiTypescript, color: 'text-blue-600', bg: 'bg-blue-600/10', category: 'lang' },
    { id: 'js', label: 'JavaScript', icon: SiJavascript, color: 'text-yellow-400', bg: 'bg-yellow-400/10', category: 'lang' },
    { id: 'python', label: 'Python', icon: FaPython, color: 'text-blue-500', bg: 'bg-blue-500/10', category: 'lang' },
    { id: 'java', label: 'Java', icon: FaJava, color: 'text-red-500', bg: 'bg-red-500/10', category: 'lang' },
    { id: 'go', label: 'Go', icon: SiGo, color: 'text-cyan-600', bg: 'bg-cyan-600/10', category: 'lang' },
    { id: 'rust', label: 'Rust', icon: FaRust, color: 'text-orange-700', bg: 'bg-orange-700/10', category: 'lang' },
    { id: 'php', label: 'PHP', icon: FaPhp, color: 'text-indigo-400', bg: 'bg-indigo-400/10', category: 'lang' },
    { id: 'kotlin', label: 'Kotlin', icon: SiKotlin, color: 'text-purple-500', bg: 'bg-purple-500/10', category: 'lang' },
    
    // --- 前端 ---
    { id: 'react', label: 'React', icon: FaReact, color: 'text-blue-400', bg: 'bg-blue-400/10', category: 'front' },
    { id: 'vue', label: 'Vue.js', icon: SiVuedotjs, color: 'text-green-500', bg: 'bg-green-500/10', category: 'front' },
    { id: 'next', label: 'Next.js', icon: SiNextdotjs, color: 'text-black dark:text-white', bg: 'bg-zinc-100 dark:bg-zinc-800', category: 'front' },
    { id: 'angular', label: 'Angular', icon: SiAngular, color: 'text-red-600', bg: 'bg-red-600/10', category: 'front' },
    { id: 'svelte', label: 'Svelte', icon: SiSvelte, color: 'text-orange-500', bg: 'bg-orange-500/10', category: 'front' },
    { id: 'tailwind', label: 'Tailwind', icon: SiTailwindcss, color: 'text-cyan-400', bg: 'bg-cyan-400/10', category: 'front' },
    { id: 'html', label: 'HTML5', icon: SiHtml5, color: 'text-orange-500', bg: 'bg-orange-500/10', category: 'front' },
    { id: 'css', label: 'CSS3', icon: SiCss3, color: 'text-blue-500', bg: 'bg-blue-500/10', category: 'front' },
    { id: 'vite', label: 'Vite', icon: SiVite, color: 'text-purple-500', bg: 'bg-purple-500/10', category: 'front' },
    { id: 'flutter', label: 'Flutter', icon: SiFlutter, color: 'text-cyan-400', bg: 'bg-cyan-400/10', category: 'front' },

    // --- 后端 ---
    { id: 'node', label: 'Node.js', icon: FaNodeJs, color: 'text-green-600', bg: 'bg-green-600/10', category: 'back' },
    { id: 'express', label: 'Express', icon: SiExpress, color: 'text-zinc-500', bg: 'bg-zinc-500/10', category: 'back' },
    { id: 'android', label: 'Android', icon: FaAndroid, color: 'text-green-500', bg: 'bg-green-500/10', category: 'back' },
    { id: 'ios', label: 'iOS', icon: FaApple, color: 'text-zinc-800 dark:text-zinc-200', bg: 'bg-zinc-500/10', category: 'back' },
    
    // --- 数据库 ---
    { id: 'mysql', label: 'MySQL', icon: SiMysql, color: 'text-blue-600', bg: 'bg-blue-600/10', category: 'db' },
    { id: 'postgres', label: 'PostgreSQL', icon: SiPostgresql, color: 'text-blue-400', bg: 'bg-blue-400/10', category: 'db' },
    { id: 'mongo', label: 'MongoDB', icon: SiMongodb, color: 'text-green-500', bg: 'bg-green-500/10', category: 'db' },
    { id: 'redis', label: 'Redis', icon: SiRedis, color: 'text-red-500', bg: 'bg-red-500/10', category: 'db' },
    { id: 'supabase', label: 'Supabase', icon: SiSupabase, color: 'text-green-400', bg: 'bg-green-400/10', category: 'db' },
    { id: 'firebase', label: 'Firebase', icon: SiFirebase, color: 'text-yellow-500', bg: 'bg-yellow-500/10', category: 'db' },
    { id: 'prisma', label: 'Prisma', icon: SiPrisma, color: 'text-indigo-900 dark:text-indigo-300', bg: 'bg-indigo-500/10', category: 'db' },

    // --- 运维 ---
    { id: 'linux', label: 'Linux', icon: FaLinux, color: 'text-black dark:text-white', bg: 'bg-zinc-100 dark:bg-zinc-800', category: 'ops' },
    { id: 'docker', label: 'Docker', icon: FaDocker, color: 'text-blue-500', bg: 'bg-blue-500/10', category: 'ops' },
    { id: 'k8s', label: 'K8s', icon: SiKubernetes, color: 'text-blue-600', bg: 'bg-blue-600/10', category: 'ops' },
    { id: 'git', label: 'Git', icon: FaGitAlt, color: 'text-orange-600', bg: 'bg-orange-600/10', category: 'ops' },
    { id: 'nginx', label: 'Nginx', icon: SiNginx, color: 'text-green-600', bg: 'bg-green-600/10', category: 'ops' },
    { id: 'aws', label: 'AWS', icon: FaAws, color: 'text-orange-500', bg: 'bg-orange-500/10', category: 'ops' },
    { id: 'vercel', label: 'Vercel', icon: SiVercel, color: 'text-black dark:text-white', bg: 'bg-zinc-100 dark:bg-zinc-800', category: 'ops' },
    { id: 'cloudflare', label: 'Cloudflare', icon: SiCloudflare, color: 'text-orange-500', bg: 'bg-orange-500/10', category: 'ops' },
    { id: 'ubuntu', label: 'Ubuntu', icon: FaUbuntu, color: 'text-orange-500', bg: 'bg-orange-500/10', category: 'ops' },
    { id: 'github', label: 'GitHub', icon: SiGithub, color: 'text-black dark:text-white', bg: 'bg-zinc-100 dark:bg-zinc-800', category: 'ops' },
    
    // --- 工具 ---
    { id: 'vscode', label: 'VS Code', icon: VscVscode, color: 'text-blue-500', bg: 'bg-blue-500/10', category: 'tool' },
    { id: 'idea', label: 'IntelliJ', icon: SiIntellijidea, color: 'text-pink-500', bg: 'bg-pink-500/10', category: 'tool' },
    { id: 'figma', label: 'Figma', icon: FaFigma, color: 'text-purple-500', bg: 'bg-purple-500/10', category: 'tool' },
    { id: 'notion', label: 'Notion', icon: SiNotion, color: 'text-black dark:text-white', bg: 'bg-zinc-100 dark:bg-zinc-800', category: 'tool' },
    { id: 'postman', label: 'Postman', icon: SiPostman, color: 'text-orange-500', bg: 'bg-orange-500/10', category: 'tool' },
]

const DEFAULT_ICON = { icon: VscTerminalLinux, color: 'text-zinc-500', bg: 'bg-zinc-500/10' }

// === 3. 图标选择器组件 ===
const IconSelector = ({ onSelect }: { onSelect: (label: string) => void }) => {
    const categories = [
        { id: 'lang', name: '语言' },
        { id: 'front', name: '前端' },
        { id: 'back', name: '后端' },
        { id: 'db', name: '数据' },
        { id: 'ops', name: '运维' },
        { id: 'tool', name: '工具' },
    ]
    const [activeCat, setActiveCat] = useState('lang')

    return (
        <div className="mt-4 border rounded-xl bg-card overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 p-2 bg-muted/50 border-b overflow-x-auto no-scrollbar">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCat(cat.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                            activeCat === cat.id 
                                ? 'bg-white dark:bg-zinc-700 text-foreground shadow-sm' 
                                : 'text-muted-foreground hover:bg-white/50 dark:hover:bg-zinc-800/50'
                        }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
            <div className="p-3 grid grid-cols-5 gap-2">
                {ALL_ICONS.filter(i => i.category === activeCat).map((item) => {
                    const Icon = item.icon
                    return (
                        <button
                            key={item.id}
                            onClick={() => onSelect(item.label)}
                            className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-accent border border-transparent hover:border-border transition-all group"
                        >
                            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${item.bg} group-hover:scale-110 transition-transform`}>
                                <Icon className={`w-5 h-5 ${item.color}`} />
                            </div>
                            <span className="text-[10px] text-muted-foreground truncate w-full text-center">{item.label}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

// === 4. 技术栈展示组件 (预览模式) ===
const TechStackViewer = ({ content }: { content: string }) => {
    const items = content.split('\n')
        .map(line => line.replace(/^[-*]\s+/, '').trim())
        .filter(line => line.length > 0)

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((item, idx) => {
                const matchedDef = ALL_ICONS.find(def => 
                    item.toLowerCase().includes(def.id) || 
                    item.toLowerCase() === def.label.toLowerCase()
                )
                const style = matchedDef || DEFAULT_ICON
                const Icon = style.icon

                return (
                    <motion.div 
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-3 hover:bg-card transition-colors group"
                    >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.bg} ${style.color} transition-transform group-hover:scale-110`}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium truncate">{item}</span>
                    </motion.div>
                )
            })}
        </div>
    )
}

// === 5. 时间轴展示组件 ===
const TimelineViewer = ({ content }: { content: string }) => {
    const lines = content.split('\n').filter(l => l.trim().length > 0)
    return (
        <div className="relative pl-2">
            <div className="absolute left-[27px] top-2 bottom-2 w-0.5 bg-border/50" />
            <div className="space-y-6">
                {lines.map((line, idx) => {
                    const match = line.match(/^(\d{4}[-/]\d{1,2}[-/]\d{1,2})\s+(.*)$/)
                    const date = match ? match[1] : null
                    const text = match ? match[2] : line.replace(/^[-*]\s+/, '')
                    return (
                        <motion.div 
                            key={idx} 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative flex gap-4 items-start group"
                        >
                            <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-card shadow-sm group-hover:scale-110 transition-transform mt-0.5">
                                <div className="h-2 w-2 rounded-full bg-primary" />
                            </div>
                            <div className="flex-1 space-y-1">
                                {date && <div className="text-xs font-mono text-secondary bg-secondary/10 px-2 py-0.5 rounded-md w-fit mb-1">{date}</div>}
                                <p className="text-sm leading-relaxed text-foreground/90">{text}</p>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

const CardBox = ({ title, icon: Icon, children, className = '' }: { title?: string; icon?: any; children: React.ReactNode; className?: string }) => (
	<div className={`card relative p-6 flex flex-col ${className}`}>
		{(title || Icon) && (
			<div className="flex items-center gap-2 mb-4 border-b pb-2 border-border/50">
				{Icon && <Icon className="w-5 h-5 text-primary" />}
				{title && <h3 className="font-bold text-lg">{title}</h3>}
			</div>
		)}
		<div className="flex-1 overflow-auto custom-scrollbar">{children}</div>
	</div>
)

export default function Page() {
	const safeInitialData = { title: '', description: '', content: '', techStack: '', changelog: '', ...initialData } as AboutData

	const [data, setData] = useState<AboutData>(safeInitialData)
	const [originalData, setOriginalData] = useState<AboutData>(safeInitialData)
	const [isEditMode, setIsEditMode] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isPreviewMode, setIsPreviewMode] = useState(false)
	const keyInputRef = useRef<HTMLInputElement>(null)

	const { isAuth, setPrivateKey } = useAuthStore()
	const { siteContent } = useConfigStore()
	const hideEditButton = siteContent.hideEditButton ?? false
	const { content: introContent } = useMarkdownRender(data.content)

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

	const handleEnterEditMode = () => {
		setIsEditMode(true)
		setIsPreviewMode(false)
	}

	const handleSave = async () => {
		setIsSaving(true)
		try {
			await pushAbout(data)
			setOriginalData(data)
			setIsEditMode(false)
			setIsPreviewMode(false)
			toast.success('保存成功！')
		} catch (error: any) {
			console.error('Failed to save:', error)
			toast.error(`保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	const handleCancel = () => {
		setData(originalData)
		setIsEditMode(false)
		setIsPreviewMode(false)
	}

    // 辅助函数：添加图标到文本框
    const addTechToStack = (label: string) => {
        const current = data.techStack
        const prefix = current.length > 0 && !current.endsWith('\n') ? '\n' : ''
        setData({ ...data, techStack: current + prefix + label })
        toast.success(`已添加 ${label}`)
    }

	const buttonText = isAuth ? '保存更新' : '导入密钥'

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isEditMode && (e.ctrlKey || e.metaKey) && e.key === ',') {
				e.preventDefault()
				setIsEditMode(true)
				setIsPreviewMode(false)
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [isEditMode])

	const textareaClass = "w-full h-full resize-none bg-transparent p-2 text-sm focus:outline-none font-mono leading-relaxed min-h-[150px]"

	return (
		<>
			<input ref={keyInputRef} type='file' accept='.pem' className='hidden' onChange={async e => {
				const f = e.target.files?.[0]
				if (f) await handleChoosePrivateKey(f)
				if (e.currentTarget) e.currentTarget.value = ''
			}} />

			<div className='flex flex-col items-center justify-center px-4 pt-24 pb-12 w-full'>
				<div className='w-full max-w-[1200px] space-y-8'>
					
					{isEditMode && !isPreviewMode ? (
						<div className="space-y-4 max-w-2xl mx-auto">
							<input type='text' placeholder='页面标题' className='w-full text-center text-3xl font-bold bg-transparent border-b border-border/50 pb-2 focus:outline-none focus:border-primary' value={data.title} onChange={e => setData({ ...data, title: e.target.value })} />
							<input type='text' placeholder='页面简短描述' className='w-full text-center text-lg text-secondary bg-transparent focus:outline-none' value={data.description} onChange={e => setData({ ...data, description: e.target.value })} />
						</div>
					) : (
						<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className='text-center mb-8'>
							<h1 className='text-4xl font-bold mb-3'>{data.title}</h1>
							<p className='text-secondary text-lg'>{data.description}</p>
						</motion.div>
					)}

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<div className="lg:col-span-2 flex flex-col gap-6">
							<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="min-h-[250px]">
								<CardBox title="个人介绍" icon={User} className="h-full bg-card/50 backdrop-blur-sm">
									{isEditMode && !isPreviewMode ? (
										<textarea placeholder="支持 Markdown..." className={textareaClass} value={data.content} onChange={e => setData({ ...data, content: e.target.value })} />
									) : (
										<div className="prose prose-sm dark:prose-invert max-w-none">{introContent}</div>
									)}
								</CardBox>
							</motion.div>

							<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="min-h-[200px]">
								<CardBox title="技术栈" icon={Cpu} className="h-full bg-card/50 backdrop-blur-sm">
									{isEditMode && !isPreviewMode ? (
                                        <div className="flex flex-col h-full">
                                            <div className="flex-1 min-h-[120px]">
                                                <textarea 
                                                    placeholder="点击下方图标添加..." 
                                                    className={`${textareaClass} border-b border-border/50 mb-2`}
                                                    value={data.techStack} 
                                                    onChange={e => setData({ ...data, techStack: e.target.value })} 
                                                />
                                            </div>
                                            <IconSelector onSelect={addTechToStack} />
                                        </div>
									) : (
										<TechStackViewer content={data.techStack} />
									)}
								</CardBox>
							</motion.div>
						</div>

						<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-1 h-full min-h-[500px]">
							<CardBox title="更新日志" icon={History} className="h-full bg-card/50 backdrop-blur-sm border-l-4 border-l-primary/20">
								{isEditMode && !isPreviewMode ? (
									<textarea placeholder="格式：日期 + 内容，例如：&#13;&#10;2026-01-21 更新了首页" className={textareaClass} value={data.changelog} onChange={e => setData({ ...data, changelog: e.target.value })} />
								) : (
									<TimelineViewer content={data.changelog} />
								)}
							</CardBox>
						</motion.div>
					</div>

					<div className='mt-12 flex flex-col items-center justify-center gap-6'>
						<motion.a href='https://github.com/spencerkk920' target='_blank' rel='noreferrer' initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.1 }} className='bg-card flex h-[50px] w-[50px] items-center justify-center rounded-full border shadow-sm text-secondary hover:text-primary transition-colors'>
							<GithubSVG className="w-6 h-6" />
						</motion.a>
						<LikeButton slug='about-page' delay={0.3} />
					</div>
				</div>
			</div>

			<motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className='fixed top-4 right-6 z-20 flex gap-3 max-sm:hidden'>
				{isEditMode ? (
					<>
						<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCancel} disabled={isSaving} className='flex items-center gap-2 rounded-xl border bg-white/80 px-4 py-2 text-sm shadow-sm backdrop-blur dark:bg-zinc-800/80 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'><X className="w-4 h-4" /> 取消</motion.button>
						<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsPreviewMode(prev => !prev)} disabled={isSaving} className={`flex items-center gap-2 rounded-xl border bg-white/80 px-4 py-2 text-sm shadow-sm backdrop-blur dark:bg-zinc-800/80`}>{isPreviewMode ? <><Edit3 className="w-4 h-4"/> 继续编辑</> : <><Eye className="w-4 h-4"/> 预览效果</>}</motion.button>
						<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSaveClick} disabled={isSaving} className='brand-btn px-6 flex items-center gap-2 shadow-md'><Save className="w-4 h-4" />{isSaving ? '保存中...' : buttonText}</motion.button>
					</>
				) : (
					!hideEditButton && (
						<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleEnterEditMode} className='flex items-center gap-2 rounded-xl border bg-white/60 px-4 py-2 text-sm backdrop-blur-md transition-colors hover:bg-white/90 shadow-sm dark:bg-zinc-800/60'><Edit3 className="w-4 h-4" /> 编辑页面</motion.button>
					)
				)}
			</motion.div>
		</>
	)
}
