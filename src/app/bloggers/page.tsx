import { redirect } from 'next/navigation'

export default function Page() {
	redirect('/share?tab=bloggers')
}
