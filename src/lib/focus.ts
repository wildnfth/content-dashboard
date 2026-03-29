import type { KeyboardEvent } from 'react'

const focusableSelector = [
  "input:not([type='hidden']):not([disabled])",
  'textarea:not([disabled])',
  'select:not([disabled])',
].join(', ')

export function focusNextFieldOrSubmit(
  event: KeyboardEvent<HTMLElement>,
  onDone: () => void,
) {
  if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) {
    return
  }

  const currentField = event.target
  if (!(currentField instanceof HTMLElement)) {
    return
  }

  const formScope = event.currentTarget
  if (!(formScope instanceof HTMLElement)) {
    return
  }

  const allFields = Array.from(formScope.querySelectorAll<HTMLElement>(focusableSelector))
  const currentIndex = allFields.indexOf(currentField)

  if (currentIndex >= 0) {
    const nextField = allFields[currentIndex + 1]

    if (nextField) {
      event.preventDefault()
      nextField.focus()
      return
    }
  }

  event.preventDefault()
  onDone()
}
