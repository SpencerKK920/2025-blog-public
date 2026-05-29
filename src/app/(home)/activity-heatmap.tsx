'use client'

import { useMemo } from 'react'
import type { BlogIndexItem } from '@/hooks/use-blog-index'

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const COLORS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']

interface Props {
	items: BlogIndexItem[]
}

export default function ActivityHeatmap({ items }: Props) {
	const { weeks, monthPositions, totalThisYear } = useMemo(() => {
		const year = new Date().getFullYear()

		const activeDays = new Set<string>()
		for (const item of items) {
			const d = new Date(item.date)
			if (d.getFullYear() === year) {
				activeDays.add(`${d.getMonth() + 1}-${d.getDate()}`)
			}
		}
		let activeCount = 0

		const jan1 = new Date(year, 0, 1)
		const startDate = new Date(jan1)
		startDate.setDate(jan1.getDate() - jan1.getDay())

		const weeksArray: { month: number; day: number; key: string }[][] = []
		const monthStarts: Map<number, number> = new Map()
		let currentDate = new Date(startDate)
		let wi = 0

		while (currentDate.getFullYear() <= year) {
			const week: { month: number; day: number; key: string }[] = []
			for (let dow = 0; dow < 7; dow++) {
				const m = currentDate.getMonth()
				const d = currentDate.getDate()
				const key = `${m + 1}-${d}`
				week.push({ month: m, day: d, key })
				if (activeDays.has(key)) activeCount++
				if (d === 1 && !monthStarts.has(m)) monthStarts.set(m, wi)
				currentDate.setDate(currentDate.getDate() + 1)
			}
			weeksArray.push(week)
			wi++
			if (currentDate.getFullYear() > year && currentDate.getMonth() === 0 && currentDate.getDate() > 1) break
		}

		const positions: { label: string; col: number }[] = []
		for (let m = 0; m < 12; m++) {
			const col = monthStarts.get(m)
			if (col !== undefined) positions.push({ label: MONTH_LABELS[m], col })
		}

		return { weeks: weeksArray, monthPositions: positions, totalThisYear: activeCount }
	}, [items])

	const CELL = 14
	const GAP = 3

	return (
		<div className='mt-3 overflow-x-auto'>
			<div className='flex text-xs' style={{ gap: GAP }}>
				{monthPositions.map((m, i) => (
					<span
						key={m.label}
						className='shrink-0 text-secondary/50'
						style={{
							marginLeft: i === 0 ? 0 : (m.col - (monthPositions[i - 1]?.col || 0) - 1) * (CELL + GAP),
							width: CELL
						}}
					>
						{m.label}
					</span>
				))}
			</div>
			<div className='mt-1 flex' style={{ gap: GAP }}>
				{weeks.map((week, wi) => (
					<div key={wi} className='flex flex-col' style={{ gap: GAP }}>
						{week.map(day => {
							const active = items.some(item => {
								const d = new Date(item.date)
								return d.getFullYear() === new Date().getFullYear() && d.getMonth() === day.month && d.getDate() === day.day
							})
							return (
								<div
									key={day.key}
									className='rounded-sm'
									style={{
										width: CELL,
										height: CELL,
										backgroundColor: active ? COLORS[3] : COLORS[0]
									}}
									title={`${day.month + 1}/${day.day}: ${active ? '发布文章' : '无'}`}
								/>
							)
						})}
					</div>
				))}
			</div>
			<p className='text-secondary/50 mt-1.5 text-xs'>
				今年已发布 {totalThisYear} 篇文章，累计 {items.length} 篇
			</p>
		</div>
	)
}
