import { toast } from 'sonner'
import { getAuthToken } from '@/lib/auth'
import { GITHUB_CONFIG } from '@/consts'
import { createBlob, createCommit, createTree, getRef, listRepoFilesRecursive, toBase64Utf8, TreeItem, updateRef } from '@/lib/github-client'
import { removeBlogFromIndex } from '@/lib/blog-index'

export async function deleteBlog(slug: string): Promise<void> {
	if (!slug) throw new Error('需要 slug')

	const token = await getAuthToken()

	toast.info('正在获取分支信息...')
	const refData = await getRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`)
	const latestCommitSha = refData.sha

	const basePath = `public/blogs/${slug}`

	toast.info('正在收集文章文件...')
	// Collect both folder-based and flat .md files
	const folderFiles = await listRepoFilesRecursive(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, basePath, GITHUB_CONFIG.BRANCH)
	let allFiles = [...folderFiles]
	try {
		const flatFiles = await listRepoFilesRecursive(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `${basePath}.md`, GITHUB_CONFIG.BRANCH)
		allFiles = [...allFiles, ...flatFiles]
	} catch {
		// flat file doesn't exist — ignore
	}
	if (allFiles.length === 0) {
		throw new Error('文章不存在或已删除')
	}

	const treeItems: TreeItem[] = allFiles.map(path => ({
		path,
		mode: '100644',
		type: 'blob',
		sha: null
	}))

	toast.info('正在更新索引...')
	const indexJson = await removeBlogFromIndex(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, slug, GITHUB_CONFIG.BRANCH)
	const indexBlob = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, toBase64Utf8(indexJson), 'base64')
	treeItems.push({
		path: 'public/blogs/index.json',
		mode: '100644',
		type: 'blob',
		sha: indexBlob.sha
	})

	toast.info('正在创建提交...')
	const treeData = await createTree(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, treeItems, latestCommitSha)
	const commitData = await createCommit(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `删除文章: ${slug}`, treeData.sha, [latestCommitSha])

	toast.info('正在更新分支...')
	await updateRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`, commitData.sha)

	toast.success('删除成功！请等待页面部署后刷新')
}
