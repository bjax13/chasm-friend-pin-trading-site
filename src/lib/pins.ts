import type { PinName } from '@/lib/types'

/** All 5 ChasmFriend pin names in display order. */
export const PIN_NAMES: PinName[] = [
  'Howlerina',
  'Shredhead',
  'Burpslurper',
  'Cleverclaws',
  'Darren',
]

/**
 * Returns true if the given string is a valid PinName.
 */
export function isPinName(value: string): value is PinName {
  return (PIN_NAMES as string[]).includes(value)
}

/**
 * Returns a display-friendly label for a pin. Currently just returns the name
 * as-is, but provides a single place to add emoji or formatting in future.
 */
export function pinLabel(pin: PinName): string {
  return pin
}
