import { useAuthStore } from '@/hooks/use-auth'
import { getOctokit } from '@/lib/github-client'
import { GITHUB_CONFIG } from '@/consts' // 修改这里：导入 GITHUB_CONFIG
import { toast } from 'sonner'

export interface AboutData {
	title: string
	description: string
	content: string
	techStack: string
	changelog: string
    sha?: string
}

const FILE_PATH = 'src/app/about/list.json'

export const pushAbout = async (data: AboutData) => {
	const { privateKey } = useAuthStore.getState()

	if (!privateKey) {
		throw new Error('请先输入 Private Key')
	}

	const octokit = getOctokit(privateKey)

	try {
        // 1. 获取当前文件的 SHA (为了更新必须提供 SHA)
		let sha = data.sha
		if (!sha) {
			try {
				const { data: currentFile } = await octokit.rest.repos.getContent({
					owner: GITHUB_CONFIG.OWNER, // 修改这里
					repo: GITHUB_CONFIG.REPO,   // 修改这里
					path: FILE_PATH,
					ref: GITHUB_CONFIG.BRANCH,  // 修改这里
				})
				if (!Array.isArray(currentFile)) {
					sha = currentFile.sha
				}
			} catch (e) {
				// 如果文件不存在，sha 保持 undefined，直接新建
				console.warn('File not found, creating new one.')
			}
		}

        // 2. 推送更新
		const contentEncoded = Buffer.from(JSON.stringify({
            title: data.title,
            description: data.description,
            content: data.content,
            techStack: data.techStack,
            changelog: data.changelog
        }, null, 2)).toString('base64')

		await octokit.rest.repos.createOrUpdateFileContents({
			owner: GITHUB_CONFIG.OWNER, // 修改这里
			repo: GITHUB_CONFIG.REPO,   // 修改这里
			path: FILE_PATH,
			message: 'chore: update about page content',
			content: contentEncoded,
			branch: GITHUB_CONFIG.BRANCH, // 修改这里
			sha: sha,
		})

		toast.success('更新成功！')
	} catch (error) {
		console.error('Push failed:', error)
		throw error
	}
}
