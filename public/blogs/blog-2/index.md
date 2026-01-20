# 前言

对于一个影视爱好者来说，我好像从来没记录过观看情况。有时看的太多，跟人讨论时都会忘记自己是否看过，所以为我的博客设计一个追踪功能是个不错的选择。

# 一. 添加功能按钮

## 1. 创建 SVG 图标

**文件路径：**
`src/svgs/bilibili-outline.svg`  
`src/svgs/bilibili-filled.svg`

**创建代码：**

**bilibili-outline.svg**

```typescript
<svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 14L11 19L22 8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="3" y="3" width="22" height="22" rx="5" stroke="currentColor" stroke-width="2"/>
</svg>
```

**bilibili-filled.svg**

```typescript
<svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="3" width="22" height="22" rx="5" fill="currentColor"/>
  <path d="M7 14L12 19L21 9" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

## 2.与导航栏联动，使其生效在网站页面

文件：`src/components/nav-card.tsx`

```typescript
// 1. 引入新图标
import BilibiliOutlineSVG from '@/svgs/bilibili-outline.svg'
import BilibiliFilledSVG from '@/svgs/bilibili-filled.svg'

// 2. 修改导航列表配置
const navList = [
  // ... 其他图标
   {
		icon: BilibiliOutlineSVG,
		iconActive: BilibiliFilledSVG,      
		label: '追番记录',
		href: '/anime'
	}

```

## 3.错误记录

### 1. 页面新图标与旧图标位置不统一

**原因：**

自定义图标在 24x24 的容器中总会显得重心偏移，而其他图标为28x28

**解决方案：**

参考网站其他图标的规格，将 `viewBox` 统一设置为 **`0 0 28 28`**



# 二.设计追踪页面内容

## 1.设计构想

想利用某些网站的api然后经过标记让其能被网站抓取，然后再经由分类分为番剧，欧美影视剧集，电影

## 2.Trakt和TMDB实现记录抓取

### 1.获取网站api

### 2.代码实现

``` typescript
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

// api配置
const TRAKT_CLIENT_ID = ''
const TMDB_API_KEY = ''
const TRAKT_USERNAME = ''

export default function TrackingPage() {
    const [categories, setCategories] = useState<{
        anime: any[], movies: any[], shows: any[]
    }>({ anime: [], movies: [], shows: [] })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 并行抓取：已看剧集、已看电影、想看清单 [cite: 2026-01-20]
                const [watchedShows, watchedMovies, watchlist] = await Promise.all([
                    fetch(`https://api.trakt.tv/users/${TRAKT_USERNAME}/watched/shows`, {
                        headers: { 'Content-Type': 'application/json', 'trakt-api-version': '2', 'trakt-api-key': TRAKT_CLIENT_ID }
                    }).then(res => res.json()),
                    fetch(`https://api.trakt.tv/users/${TRAKT_USERNAME}/watched/movies`, {
                        headers: { 'Content-Type': 'application/json', 'trakt-api-version': '2', 'trakt-api-key': TRAKT_CLIENT_ID }
                    }).then(res => res.json()),
                    fetch(`https://api.trakt.tv/users/${TRAKT_USERNAME}/watchlist`, {
                        headers: { 'Content-Type': 'application/json', 'trakt-api-version': '2', 'trakt-api-key': TRAKT_CLIENT_ID }
                    }).then(res => res.json())
                ])

                const uniqueMap = new Map()
                // 合并所有来源并以 TMDB ID 进行终极去重 [cite: 2026-01-20]
                const combined = [...watchedShows, ...watchedMovies, ...(Array.isArray(watchlist) ? watchlist : [])]
                combined.forEach(item => {
                    const info = item.show || item.movie || item
                    if (info.ids?.tmdb) uniqueMap.set(info.ids.tmdb, item)
                })

                const rawAnime: any[] = [], rawMovies: any[] = [], rawShows: any[] = []

                // 处理前 60 部作品，通过 TMDB 详情进行智能分类 [cite: 2026-01-20]
                await Promise.all(Array.from(uniqueMap.values()).slice(0, 60).map(async (item: any) => {
                    const info = item.show || item.movie || item
                    const isMovie = !!item.movie || item.type === 'movie'
                    const tmdbId = info.ids?.tmdb
                    
                    try {
                        const tmdbData = await fetch(`https://api.themoviedb.org/3/${isMovie ? 'movie' : 'tv'}/${tmdbId}?api_key=${TMDB_API_KEY}&language=zh-CN`).then(res => res.json())

                        const processed = {
                            id: tmdbId,
                            title: tmdbData.name || tmdbData.title || info.title,
                            cover: tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : '',
                            rating: tmdbData.vote_average?.toFixed(1) || '0.0',
                            progress: isMovie ? '电影' : `已看 ${item.plays || '?'} 次 / 共 ${tmdbData.number_of_episodes || '?'} 集`,
                            evaluate: tmdbData.overview || '暂无内容介绍。',
                            link: `https://trakt.tv/${isMovie ? 'movies' : 'shows'}/${info.ids?.slug || tmdbId}`
                        }

                        // 智能识别：日本制造或日语作品标记为 Anime [cite: 2026-01-20]
                        const isAnime = tmdbData.original_language === 'ja' || tmdbData.origin_country?.includes('JP') || tmdbData.genres?.some((g: any) => g.id === 16)

                        if (isAnime) rawAnime.push(processed)
                        else if (isMovie) rawMovies.push(processed)
                        else rawShows.push(processed)
                    } catch (e) { console.error(e) }
                }))

                setCategories({ anime: rawAnime, movies: rawMovies, shows: rawShows })
                setLoading(false)
            } catch (error) { setLoading(false) }
        }
        fetchData()
    }, [])

    const renderCard = (item: any, index: number) => (
        <motion.a
            key={item.id} href={item.link} target="_blank"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className='bg-card squircle group relative flex flex-col overflow-hidden border shadow-sm transition-all hover:shadow-xl'
        >
            <div className='relative aspect-[3/4.2] overflow-hidden bg-zinc-100'>
                <img src={item.cover} alt={item.title} className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-110' />
                <div className='absolute top-2 right-2 rounded-md bg-black/60 px-2 py-1 text-[10px] text-yellow-400 backdrop-blur-md font-bold z-10'>★ {item.rating}</div>
                <div className='absolute inset-0 bg-black/80 p-4 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 text-center'>
                    <p className='text-white text-[10px] leading-relaxed line-clamp-6 px-2'>{item.evaluate}</p>
                </div>
            </div>
            <div className='p-3'>
                <h3 className='truncate text-xs font-bold text-primary transition-colors'>{item.title}</h3>
                <div className='mt-2 flex items-center text-[10px] text-secondary'>
                    <span className='h-1.5 w-1.5 rounded-full bg-brand animate-pulse mr-1.5' /> {item.progress}
                </div>
            </div>
        </motion.a>
    )

    return (
        <div className='flex flex-col items-center px-6 pt-32 pb-12'>
            <div className='mb-12 text-center'>
                <h1 className='font-averia text-4xl font-bold tracking-widest uppercase'>Library</h1>
                <div className='bg-brand mt-2 h-1 w-12 mx-auto rounded-full' />
            </div>
            {loading ? (
                <div className='text-brand animate-pulse text-sm font-medium'>正在检索全量影视库...</div>
            ) : (
                <div className="w-full max-w-[1200px] space-y-24">
                    {/* 分类渲染模块 [cite: 2026-01-20] */}
                    {[["Anime", "番剧收藏", categories.anime], ["TV Shows", "剧集归档", categories.shows], ["Movies", "电影归档", categories.movies]].map(([title, sub, list]) => (
                        list.length > 0 && (
                            <section key={title}>
                                <div className="flex items-center gap-3 mb-8 px-2">
                                    <h2 className="text-xl font-bold uppercase">{title}</h2>
                                    <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded-full font-bold">{sub}</span>
                                </div>
                                <div className='grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
                                    {list.map((item, index) => renderCard(item, index))}
                                </div>
                            </section>
                        )
                    ))}
                </div>
            )}
        </div>
    )
}
```

## 3.探索阶段

### 1.单bilibili获取番剧

**简要过程：**创建抓取路由加速填上uid 打开b站的追番隐私 利用代码进行全部拉取，并在代码设计里跳过防盗链机制

**问题**：B 站对欧美影视和老旧番剧的覆盖不足，且 API 存在较多限制。

### 2. 最终方案TMDB获取封面和简介+Trakt记录



## 4.错误记录

### 1.Trakt单纯的抓取历史而不进行去重，导致相同界面都被抓取

解决方案：

创建了一个名为 `seenIds` 的容器（`new Set()`）里面的值唯一，通过唯一标识符：TMDB ID进行筛选

