import { useId, useRef, useState } from 'react'
import { FileUp, X } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'

type FileUploaderProps = {
  label: string
  accept: string
  description?: string
  maxSizeMb?: number
  /** Data URL gambar atau teks CSV/XLSX sebagai base64 untuk parsing */
  onDataUrl: (dataUrl: string, fileName: string) => void
  className?: string
}

export function FileUploader({
  label,
  accept,
  description,
  maxSizeMb = 5,
  onDataUrl,
  className = '',
}: FileUploaderProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const showToast = useUiStore((s) => s.showToast)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFile = (file: File | null) => {
    if (!file) return
    const max = maxSizeMb * 1024 * 1024
    if (file.size > max) {
      showToast(`Berkas terlalu besar (maks. ${maxSizeMb} MB).`, 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const r = reader.result
      if (typeof r === 'string') {
        setFileName(file.name)
        onDataUrl(r, file.name)
        showToast(`Berkas "${file.name}" siap diproses.`, 'success')
      }
    }
    reader.onerror = () => {
      showToast('Gagal membaca berkas.', 'error')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      {description ? (
        <p className="mb-2 text-xs text-slate-500">{description}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null
            handleFile(f)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-navy shadow-sm transition hover:bg-slate-50"
        >
          <FileUp className="h-4 w-4" />
          Pilih berkas
        </button>
        {fileName ? (
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700">
            {fileName}
            <button
              type="button"
              className="rounded p-0.5 text-slate-500 hover:bg-slate-200"
              aria-label="Hapus pilihan"
              onClick={() => {
                setFileName(null)
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ) : null}
      </div>
    </div>
  )
}
