import { FileText, Image as ImageIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ActionSheetProps {
  isOpen: boolean
  onClose: () => void
  onShareImage: () => void
  onSharePdf: () => void
}

export function ActionSheet({ isOpen, onClose, onShareImage, onSharePdf }: ActionSheetProps) {
  const [isRendered, setIsRendered] = useState(false)

  // Gestiona el montaje para animar entrada y salida
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true)
      // Bloquear scroll de la página de fondo
      document.body.style.overflow = 'hidden'
    } else {
      // Retrasar el desmontaje para la animación de salida (opcional, pero la entrada ya es animada con Tailwind animate-in)
      const timer = setTimeout(() => setIsRendered(false), 300)
      document.body.style.overflow = ''
      return () => clearTimeout(timer)
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen && !isRendered) return null

  // Si isOpen es false, aplicaremos clases para deslizar hacia abajo
  const sheetClass = isOpen ? 'animate-in slide-in-from-bottom-full fade-in' : 'animate-out slide-out-to-bottom-full fade-out'
  const backdropClass = isOpen ? 'animate-in fade-in' : 'animate-out fade-out'

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Fondo oscuro desenfocado */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm duration-300 ${backdropClass}`}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className={`relative bg-[#F3F4F8] rounded-t-3xl w-full duration-300 ${sheetClass}`}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>
        
        <div className="px-4">
          <h3 className="text-center text-gray-500 font-medium text-sm mb-4">Compartir resumen</h3>
          
          <div className="bg-white rounded-2xl overflow-hidden mb-4 shadow-sm">
            <button 
              onClick={() => { onShareImage(); onClose() }}
              className="w-full flex items-center px-4 py-4 active:bg-gray-50 border-b border-gray-100 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mr-4">
                <ImageIcon className="w-5 h-5 text-[#0A84FF]" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-gray-900 font-medium text-[17px]">Compartir imagen</span>
                <span className="text-[#0A84FF] text-xs font-medium mt-0.5">(Recomendado para WhatsApp)</span>
              </div>
            </button>
            
            <button 
              onClick={() => { onSharePdf(); onClose() }}
              className="w-full flex items-center px-4 py-4 active:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mr-4">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <span className="text-gray-900 font-medium text-[17px]">Compartir PDF</span>
            </button>
          </div>
          
          <button 
            onClick={onClose}
            className="w-full bg-white rounded-2xl py-4 text-[#0A84FF] font-semibold text-[17px] active:bg-gray-50 transition-colors shadow-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
