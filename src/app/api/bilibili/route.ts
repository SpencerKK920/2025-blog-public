import { NextResponse } from 'next/server'

export async function GET() {
    // 你的 B 站 UID
    const BILIBILI_UID = "361813534" 

    try {
        let allItems: any[] = []
        let pn = 1
        let hasMore = true

        // 参考 RyuChan 的自动翻页抓取逻辑
        while (hasMore && pn <= 10) { // 安全起见最多抓取10页
            const res = await fetch(
                `https://api.bilibili.com/x/space/bangumi/follow/list?type=1&vmid=${BILIBILI_UID}&pn=${pn}&ps=30`,
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Referer': 'https://space.bilibili.com/'
                    }
                }
            )
            const json = await res.json()
            
            if (json.code === 0 && json.data?.list?.length > 0) {
                allItems.push(...json.data.list)
                if (allItems.length >= json.data.total) {
                    hasMore = false
                } else {
                    pn++
                }
            } else {
                hasMore = false
            }
        }

        // 数据标准化处理
        const formattedData = allItems.map(item => ({
            id: item.season_id,
            title: item.title,
            // 图片处理：支持 B 站 WebP 压缩并强制 HTTPS
            cover: item.cover.replace('http:', 'https:') + '@300w_400h.webp',
            // 获取进度：例如 "看到第5话"
            progress: item.new_ep?.index_show || '已订阅',
            rating: item.rating?.score || 0,
            evaluate: item.evaluate || item.brief || "暂无简介",
            link: `https://www.bilibili.com/bangumi/play/ss${item.season_id}`
        }))

        return NextResponse.json(formattedData)
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch Bilibili' }, { status: 500 })
    }
}
