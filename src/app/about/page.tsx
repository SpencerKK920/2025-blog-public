'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { useMarkdownRender } from '@/hooks/use-markdown-render'
import { pushAbout, type AboutData } from './services/push-about'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import LikeButton from '@/components/like-button'

// 1. 引入基础 UI 图标 (Lucide)
import { 
    User, Cpu, History, Edit3, Eye, Save, X, Zap 
} from 'lucide-react' 

// 2. 引入品牌图标 (React Icons)
import { 
    FaLinux, FaReact, FaDocker, FaGitAlt, FaNodeJs, FaPython, FaJava, FaUbuntu, FaCentos
} from 'react-icons/fa'
import { 
    SiNextdotjs, SiTypescript, SiTailwindcss, SiNginx, SiRedis, SiMongodb, SiMysql, 
    SiPostgresql, SiVercel, SiCloudflare, SiJavascript, SiHtml5, SiCss3, SiKubernetes,
    SiGnubash
} from 'react-icons/si'
import { VscTerminalLinux } from "react-icons/vsc"

import GithubSVG from '@/svgs/github.svg'
import initialData from './list.json'

// --- 3. 图标映射配置 ---
// 关键词不区分大小写，输入 "Linux" 就会自动匹配到 FaLinux (企鹅)
const ICON_MAP: Record<string, { icon: any; color: string; bg: string }> = {
    // === 运维 & 后端 ===
    'linux': { icon: FaLinux, color: 'text-black dark:text-white', bg: 'bg-zinc-100 dark:bg-zinc-800' },
    'ubuntu': { icon: FaUbuntu, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    'centos': { icon: FaCentos, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    'bash': { icon: SiGnubash, color: 'text-zinc-600', bg: 'bg-zinc-600/10' },
    'nginx': { icon: SiNginx, color: 'text-green-600', bg: 'bg-green-600/10' },
    'docker': { icon: FaDocker, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    'k8s': { icon: SiKubernetes, color: 'text-blue-600', bg: 'bg-blue-600/10' },
    'kubernetes': { icon: SiKubernetes, color: 'text-blue-600', bg: 'bg-blue-600/10' },
    'redis': { icon: SiRedis, color: 'text-red-500', bg: 'bg-red-500/10' },
    'mysql': { icon: SiMysql, color: 'text-blue-600', bg: 'bg-blue-600/10' },
    'mongodb': { icon: SiMongodb, color: 'text-green-500', bg: 'bg-green-500/10' },
    'node': { icon: FaNodeJs, color: 'text-green-600', bg: 'bg-green-600/10' },
    'python': { icon: FaPython, color: 'text-blue-500', bg: 'bg-yellow-500/10' },
    'java': { icon: FaJava, color: 'text-red-500', bg: 'bg-red-500/10' },

    // === 前端 & 全栈 ===
    'next': { icon: SiNextdotjs, color: 'text-black dark:text-white', bg: 'bg-zinc-100 dark:bg-zinc-800' },
    'react': { icon: FaReact, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    'ts': { icon: SiTypescript, color: 'text-blue-600', bg: 'bg-blue-600/10' },
    'typescript': { icon: SiTypescript, color: 'text-blue-600', bg: 'bg-blue-600/1
