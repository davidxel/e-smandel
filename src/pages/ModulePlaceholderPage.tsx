import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

type ModulePlaceholderPageProps = {
  title: string
  description: string
}

export function ModulePlaceholderPage({
  title,
  description,
}: ModulePlaceholderPageProps) {
  const navigate = useNavigate()
  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/app')}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-brand-navy hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Dashboard
      </button>
      <h1 className="text-xl font-bold text-slate-800 md:text-2xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
      <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center text-sm text-slate-500">
        Form dan tabel modul ini akan dilengkapi pada iterasi berikutnya
        (input poin, absensi, prestasi, ekspor PDF).
      </div>
    </div>
  )
}
