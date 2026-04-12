import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'

export function ToastHost() {
  const toast = useUiStore((s) => s.toast)
  if (!toast) return null

  const styles =
    toast.variant === 'success'
      ? 'border-emerald-500/40 bg-emerald-950/90 text-emerald-50'
      : toast.variant === 'error'
        ? 'border-red-500/40 bg-red-950/90 text-red-50'
        : 'border-sky-500/40 bg-sky-950/90 text-sky-50'

  const Icon =
    toast.variant === 'success'
      ? CheckCircle2
      : toast.variant === 'error'
        ? AlertCircle
        : Info

  return (
    <div
      className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex w-[min(92vw,28rem)] -translate-x-1/2 justify-center px-4"
      role="status"
    >
      <div
        className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-sm ${styles}`}
      >
        <Icon className="mt-0.5 h-5 w-5 shrink-0 opacity-90" aria-hidden />
        <p className="leading-snug">{toast.message}</p>
      </div>
    </div>
  )
}
