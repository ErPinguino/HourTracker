import { FileText, Image as ImageIcon } from 'lucide-react'
import { Dialog } from '@animate-ui/react/primitives/base-ui/dialog'

interface ActionSheetProps {
  isOpen: boolean
  onClose: () => void
  onShareImage: () => void
  onSharePdf: () => void
}

export function ActionSheet({ isOpen, onClose, onShareImage, onSharePdf }: ActionSheetProps) {
  return <Dialog.Root open={isOpen} onOpenChange={open => { if (!open) onClose() }}>
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
      <Dialog.Popup data-side="bottom" className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-card px-4 pt-5 pb-[calc(1rem+env(safe-area-inset-bottom))] text-main outline-none">
        <Dialog.Title className="mb-4 text-center text-base font-semibold">Compartir resumen</Dialog.Title>
        <Dialog.Description className="sr-only">Elige el formato del resumen mensual.</Dialog.Description>
        <button onClick={() => { onShareImage(); onClose() }} className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left hover:bg-black/5 dark:hover:bg-white/5"><ImageIcon className="shrink-0 text-accent" /><span>Compartir imagen<small className="block text-sec">Recomendado para WhatsApp</small></span></button>
        <button onClick={() => { onSharePdf(); onClose() }} className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left hover:bg-black/5 dark:hover:bg-white/5"><FileText className="shrink-0 text-accent" />Compartir PDF</button>
        <Dialog.Close className="mt-3 min-h-12 w-full rounded-2xl border border-border font-semibold text-accent">Cancelar</Dialog.Close>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>
}
