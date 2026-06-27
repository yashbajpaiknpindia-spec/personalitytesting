import { redirect } from 'next/navigation'

export const metadata = { title: 'Edit Generated Asset' }

type Props = { searchParams?: { gen?: string; tab?: string } }

export default function BusinessEditPage({ searchParams }: Props) {
  const gen = searchParams?.gen?.trim()
  const tab = (searchParams?.tab || 'logo').trim() || 'logo'
  if (gen) redirect(`/generate?gen=${encodeURIComponent(gen)}&tab=${encodeURIComponent(tab)}&aiEdit=1`)
  redirect('/generate')
}
