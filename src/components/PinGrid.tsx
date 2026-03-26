'use client'

import { useOptimistic, useTransition } from 'react'
import { PIN_NAMES } from '@/lib/pins'
import { upsertPinInventory } from '@/actions/inventory'
import type { PinInventory, PinName } from '@/lib/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PinGridProps {
  /** Current inventory rows for this user. May be empty if none saved yet. */
  pins: PinInventory[]
  disabled?: boolean
}

/** Lightweight local state for a single pin's toggles. */
interface PinState {
  hasIt: boolean
  wantsIt: boolean
}

type InventoryMap = Record<PinName, PinState>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildInventoryMap(pins: PinInventory[]): InventoryMap {
  const defaults: InventoryMap = {
    Howlerina: { hasIt: false, wantsIt: false },
    Shredhead: { hasIt: false, wantsIt: false },
    Burpslurper: { hasIt: false, wantsIt: false },
    Cleverclaws: { hasIt: false, wantsIt: false },
    Darren: { hasIt: false, wantsIt: false },
  }

  for (const pin of pins) {
    if (pin.pin_name in defaults) {
      defaults[pin.pin_name as PinName] = {
        hasIt: pin.has_it,
        wantsIt: pin.wants_it,
      }
    }
  }

  return defaults
}

// ---------------------------------------------------------------------------
// PinCard sub-component
// ---------------------------------------------------------------------------

interface PinCardProps {
  pinName: PinName
  state: PinState
  onToggleHas: () => void
  onToggleWants: () => void
  disabled: boolean
}

function PinCard({ pinName, state, onToggleHas, onToggleWants, disabled }: PinCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-brand-200 bg-white p-4 shadow-sm">
      <h3 className="text-center text-sm font-semibold text-brand-900">{pinName}</h3>

      <div className="flex flex-col gap-2">
        {/* "Have It" toggle */}
        <button
          type="button"
          onClick={onToggleHas}
          disabled={disabled}
          aria-pressed={state.hasIt}
          className={[
            'rounded-lg px-3 py-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
            state.hasIt
              ? 'bg-brand-500 text-white hover:bg-brand-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          ].join(' ')}
        >
          {state.hasIt ? 'Have It' : 'Have It'}
        </button>

        {/* "Want It" toggle */}
        <button
          type="button"
          onClick={onToggleWants}
          disabled={disabled}
          aria-pressed={state.wantsIt}
          className={[
            'rounded-lg px-3 py-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
            state.wantsIt
              ? 'bg-accent-400 text-white hover:bg-accent-500'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          ].join(' ')}
        >
          {state.wantsIt ? 'Want It' : 'Want It'}
        </button>
      </div>

      {/* Status indicator */}
      <p className="text-center text-xs text-gray-400">
        {state.hasIt && state.wantsIt
          ? 'Have & Want more'
          : state.hasIt
            ? 'Available to trade'
            : state.wantsIt
              ? 'Looking for this one'
              : 'Not in collection'}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PinGrid — main export
// ---------------------------------------------------------------------------

export default function PinGrid({ pins, disabled = false }: PinGridProps) {
  const [isPending, startTransition] = useTransition()

  const [optimisticInventory, updateOptimistic] = useOptimistic<
    InventoryMap,
    { pinName: PinName; hasIt: boolean; wantsIt: boolean }
  >(buildInventoryMap(pins), (current, { pinName, hasIt, wantsIt }) => ({
    ...current,
    [pinName]: { hasIt, wantsIt },
  }))

  function handleToggle(
    pinName: PinName,
    field: 'hasIt' | 'wantsIt'
  ) {
    const current = optimisticInventory[pinName]
    const next =
      field === 'hasIt'
        ? { hasIt: !current.hasIt, wantsIt: current.wantsIt }
        : { hasIt: current.hasIt, wantsIt: !current.wantsIt }

    startTransition(async () => {
      // Optimistically apply the change immediately
      updateOptimistic({ pinName, hasIt: next.hasIt, wantsIt: next.wantsIt })

      // Persist to the server
      await upsertPinInventory(pinName, next.hasIt, next.wantsIt)
    })
  }

  const isDisabled = disabled || isPending

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
      {PIN_NAMES.map((pinName) => (
        <PinCard
          key={pinName}
          pinName={pinName}
          state={optimisticInventory[pinName]}
          onToggleHas={() => handleToggle(pinName, 'hasIt')}
          onToggleWants={() => handleToggle(pinName, 'wantsIt')}
          disabled={isDisabled}
        />
      ))}
    </div>
  )
}
