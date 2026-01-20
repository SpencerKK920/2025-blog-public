'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

const TRAKT_CLIENT_ID = '23a43b1011bc7e1490da9aa9ada0eea7b028135a65f668cac7885ac9b0ec0b65'
const TMDB_API_KEY = 'c06994e9e33158fdac8dfda5befad851'
const TRAKT_USERNAME = 'SpencerKK'

export default function TrackingPage() {
    const [categories, setCategories] = useState<{
        anime: any[], movies: any[], shows: any[]
    }>({ anime: [], movies: [], shows: [] })
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        const fetchExhaustiveData = async () => {
            try {
                // 1. 获取最近 100 条历史（天然按时间倒序）和 收藏夹 [cite: 2026-01-20]
                const [historyRes, watchlistRes] = await Promise.all([
                    fetch(`https://api.trakt.tv/users/${TRAKT_USERNAME}/history?limit=200`, {
                        headers: { 'Content-Type': 'application/json', 'trakt-api-version': '2', 'trakt-api-key': TRAKT_CLIENT_ID },
                        cache: 'no-store' 
                    }),
                    fetch(`https://api.trakt.tv/users/${TRAKT_USERNAME}/watchlist`, {
                        headers: { 'Content-Type': 'application/json', 'trakt-api-version': '2', 'trakt-api-key': TRAKT_CLIENT_ID },
                        cache: 'no-store'
                    })
                ])

                const history = await historyRes.json()
                const watchlist = await watchlistRes.json()

                // 2. 合并并去重：保持历史记录（最新观看）的优先顺序
                const combined = [...(Array.isArray(history) ? history : []), ...(Array.isArray(watchlist) ? watchlist : [])]
                const uniqueMap = new Map()
                
                combined.forEach(item => {
                    const info = item.show || item.movie || item
                    const tmdbId = info.ids?.tmdb
                    if (tmdbId && !uniqueMap.has(tmdbId)) {
                        uniqueMap.set(tmdbId, item)
                    }
                })

                const rawAnime: any[] = [], rawMovies: any[] = [], rawShows: any[] = []
                // 3. 处理前 80 个唯一作品，确保覆盖面
                const itemsToProcess = Array.from(uniqueMap.values()).slice(0, 200)

                await Promise.all(itemsToProcess.map(async (item: any) => {
                    const info = item.show || item.movie || item
                    const isMovie = item.type === 'movie' || !!item.movie
                    const tmdbId = info.ids?.tmdb
                    
                    try {
                        const tmdbRes = await fetch(`https://api.themoviedb.org/3/${isMovie ? 'movie' : 'tv'}/${tmdbId}?api_key=${TMDB_API_KEY}&language=zh-CN`)
                        const tmdbData = await tmdbRes.json()

                        // 获取进度文字
                        let progressText = '电影'
                        if (!isMovie) {
                            // 统计已看集数：如果有详细季信息则累加，否则显示当前播放次数
                            const watchedCount = item.seasons 
                                ? item.seasons.reduce((acc: number, s: any) => acc + s.episodes.length, 0)
                                : (item.plays || '1')
                            progressText = `已看 ${watchedCount} 集 / 共 ${tmdbData.number_of_episodes || '?'} 集`
                        }

                        const processedItem = {
                            id: tmdbId,
                            title: tmdbData.name || tmdbData.title || info.title,
                            cover: tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : '',
                            rating: tmdbData.vote_average?.toFixed(1) || '0.0',
                            progress: progressText,
                            evaluate: tmdbData.overview || '暂无内容介绍。',
                            link: `https://trakt.tv/${isMovie ? 'movies' : 'shows'}/${info.ids?.slug || tmdbId}`
                        }

                        // 分类算法逻辑
                        const isAnime = tmdbData.original_language === 'ja' || 
                                        tmdbData.origin_country?.includes('JP') || 
                                        tmdbData.genres?.some((g: any) => g.id === 16)

                        if (isAnime) rawAnime.push(processedItem)
                        else if (isMovie) rawMovies.push(processedItem)
                        else rawShows.push(processedItem)
                    } catch (e) { console.error("TMDB Fetch Error", e) }
                }))

                setCategories({ anime: rawAnime, movies: rawMovies, shows: rawShows })
                setLoading(false)
            } catch (error) { setLoading(false) }
        }
        fetchExhaustiveData()
    }, [])

    const filterList = (list: any[]) => 
        list.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))

    const renderCard = (item: any, index: number) => (
        <motion.a
            key={item.id} href={item.link} target="_blank"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className='bg-card squircle group relative flex flex-col overflow-hidden border shadow-sm transition-all hover:shadow-xl'
        >
            <div className='relative aspect-[3/4.2] overflow-hidden bg-zinc-100'>
                {item.cover ? (
                    <img src={item.cover} alt={item.title} className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-110' />
                ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-zinc-400">NO POSTER</div>
                )}
                <div className='absolute top-2 right-2 rounded-md bg-black/60 px-2 py-1 text-[10px] text-yellow-400 backdrop-blur-md font-bold z-10'>★ {item.rating}</div>
                <div className='absolute inset-0 bg-black/80 p-4 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 text-center'>
                    <p className='text-white text-[10px] leading-relaxed line-clamp-6 px-2'>{item.evaluate}</p>
                </div>
            </div>
            <div className='p-3'>
                <h3 className='truncate text-xs font-bold text-primary group-hover:text-brand transition-colors'>{item.title}</h3>
                <div className='mt-2 flex items-center text-[10px] text-secondary'>
                    <span className='h-1.5 w-1.5 rounded-full bg-brand animate-pulse mr-1.5' /> {item.progress}
                </div>
            </div>
        </motion.a>
    )

    const renderSection = (title: string, sub: string, list: any[]) => {
        const filtered = filterList(list)
        return filtered.length > 0 && (
            <section>
                <div className="flex items-center gap-3 mb-8 px-2">
                    <h2 className="text-xl font-bold tracking-tighter uppercase">{title}</h2>
                    <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded-full font-bold">{sub}</span>
                </div>
                <div className='grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
                    {filtered.map((item, index) => renderCard(item, index))}
                </div>
            </section>
        )
    }

    return (
        <div className='flex flex-col items-center px-6 pt-32 pb-12'>
            <div className='mb-10 text-center'>
                <h1 className='font-averia text-4xl font-bold tracking-tight uppercase tracking-widest'>Library</h1>
                <div className='bg-brand mt-2 h-1 w-12 mx-auto rounded-full' />
            </div>

            {!loading && (
                <div className='relative w-full max-w-[500px] mb-16'>
                    <div className='absolute inset-y-0 left-4 flex items-center pointer-events-none'>
                        <svg className='w-4 h-4 text-secondary/50' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="搜索我的观影清单..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className='w-full bg-secondary/5 border border-secondary/10 px-11 py-2.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all placeholder:text-secondary/40'
                    />
                </div>
            )}

            {loading ? (
                <div className='text-brand animate-pulse text-sm font-medium'>正在检索全量影视库...</div>
            ) : (
                <div className="w-full max-w-[1200px] space-y-24">
                    {renderSection("Anime", "番剧收藏 & 归档", categories.anime)}
                    {renderSection("TV Shows", "剧集归档", categories.shows)}
                    {renderSection("Movies", "电影归档", categories.movies)}
                </div>
            )}
        </div>
    )
}
