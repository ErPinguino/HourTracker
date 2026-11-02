import { useState, type Ref } from 'react'
import { Combobox } from '@animate-ui/react/primitives/base-ui/combobox'
import { Check, ChevronDown } from 'lucide-react'

interface Props {
  id: string
  value: string
  locations: string[]
  onChange: (value: string) => void
  onBlur: () => void
  inputRef: Ref<HTMLInputElement>
  disabled: boolean
  invalid: boolean
}

/** One editable value, shared by typing and selection from recent locations. */
export function WorkLocationInput({ id, value, locations, onChange, onBlur, inputRef, disabled, invalid }: Props) {
  const [open, setOpen] = useState(false)
  return <Combobox.Root items={locations} filter={null} openOnInputClick={false}
    open={open && !disabled && locations.length > 0}
    onOpenChange={(nextOpen, details) => {
      // Only the trigger may open the list; every normal dismissal may close it.
      if (nextOpen && details.reason !== 'trigger-press') {
        details.cancel()
        return
      }
      setOpen(nextOpen)
    }}
    inputValue={value} value={locations.includes(value) ? value : null}
    onInputValueChange={(text, details) => {
      if (details.reason === 'input-change') {
        setOpen(false)
        onChange(text)
      }
    }}
    onValueChange={location => { if (location !== null) { onChange(location); setOpen(false) } }} disabled={disabled}>
    <div className="flex min-w-0 w-full items-center">
      <Combobox.Input id={id} ref={inputRef} onBlur={onBlur} onPointerDown={() => setOpen(false)} aria-invalid={invalid} autoComplete="off"
        placeholder={locations.length ? 'Lugares recientes' : 'Opcional'}
        className="w-full min-w-0 bg-transparent text-right text-[17px] text-sec focus:outline-none" />
      {locations.length > 0 && <Combobox.Trigger aria-label="Lugares recientes" className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-sec focus-visible:ring-2 focus-visible:ring-accent"><ChevronDown size={18} /></Combobox.Trigger>}
    </div>
    <Combobox.Portal>
      <Combobox.Positioner sideOffset={6} align="end" collisionPadding={12} className="z-[70] outline-none">
        <Combobox.Popup transition={{ duration: 0.16 }} exitTransition={{ duration: 0.12 }}
          className="w-[max(15rem,var(--anchor-width))] max-w-[var(--available-width)] overflow-hidden rounded-2xl border border-border bg-card text-main shadow-lg outline-none">
          <p className="px-3 py-2 text-xs font-medium text-sec">Lugares recientes</p>
          <Combobox.List className="max-h-[min(16rem,calc(var(--available-height)-2.5rem))] overflow-y-auto overscroll-contain p-1">
            {(location: string) => <Combobox.Item key={location} value={location}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-[16px] outline-none data-[highlighted]:bg-accent/10 data-[highlighted]:text-accent">
              <span className="min-w-0 flex-1 whitespace-normal [overflow-wrap:anywhere]">{location}</span>
              <Combobox.ItemIndicator className="shrink-0 text-accent"><Check size={16} /></Combobox.ItemIndicator>
            </Combobox.Item>}
          </Combobox.List>
          <Combobox.Empty className="px-3 pb-3 text-sm text-sec">Puedes escribir un lugar nuevo.</Combobox.Empty>
        </Combobox.Popup>
      </Combobox.Positioner>
    </Combobox.Portal>
  </Combobox.Root>
}
