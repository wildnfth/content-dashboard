import { useCallback, useRef } from 'react'

const BODY_LOCK_ATTR = 'data-scroll-locked'

let lockDepth = 0
let savedScrollY = 0
let previousBodyStyles: Partial<CSSStyleDeclaration> | null = null

function lockBodyScroll() {
  if (typeof window === 'undefined') {
    return
  }

  const { body } = document

  if (lockDepth === 0) {
    savedScrollY = window.scrollY
    previousBodyStyles = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      left: body.style.left,
      right: body.style.right,
      overscrollBehavior: body.style.overscrollBehavior,
      touchAction: body.style.touchAction,
    }

    body.setAttribute(BODY_LOCK_ATTR, 'true')
    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${savedScrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    body.style.overscrollBehavior = 'none'
    body.style.touchAction = 'none'
  }

  lockDepth += 1
}

function unlockBodyScroll() {
  if (typeof window === 'undefined' || lockDepth === 0) {
    return
  }

  lockDepth -= 1

  if (lockDepth > 0) {
    return
  }

  const { body } = document
  const nextScrollY = Math.abs(Number.parseInt(body.style.top || '0', 10)) || savedScrollY

  body.removeAttribute(BODY_LOCK_ATTR)
  body.style.overflow = previousBodyStyles?.overflow ?? ''
  body.style.position = previousBodyStyles?.position ?? ''
  body.style.top = previousBodyStyles?.top ?? ''
  body.style.left = previousBodyStyles?.left ?? ''
  body.style.right = previousBodyStyles?.right ?? ''
  body.style.width = previousBodyStyles?.width ?? ''
  body.style.overscrollBehavior = previousBodyStyles?.overscrollBehavior ?? ''
  body.style.touchAction = previousBodyStyles?.touchAction ?? ''

  previousBodyStyles = null
  const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)

  if (!isJsdom && typeof window.scrollTo === 'function') {
    try {
      window.scrollTo(0, nextScrollY)
    }
    catch {
      // JSDOM does not fully implement scrolling APIs.
    }
  }
}

export function useBodyScrollLockRef<T extends HTMLElement>() {
  const isLockedRef = useRef(false)

  return useCallback((node: T | null) => {
    if (node && !isLockedRef.current) {
      lockBodyScroll()
      isLockedRef.current = true
      return
    }

    if (!node && isLockedRef.current) {
      unlockBodyScroll()
      isLockedRef.current = false
    }
  }, [])
}
