import { useLayoutEffect, useRef, type ReactNode } from 'react'
import './farmer-theme.css'

const emojiPattern = /(?:\p{Regional_Indicator}{2}|[#*0-9]\uFE0F?\u20E3|\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)/gu

function removeEmojiFromText(root: Node) {
  const documentRoot = root.ownerDocument || document
  const walker = documentRoot.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []

  while (walker.nextNode()) textNodes.push(walker.currentNode as Text)

  textNodes.forEach((node) => {
    const cleaned = node.data.replace(emojiPattern, '').replace(/\s{2,}/g, ' ')
    if (cleaned !== node.data) node.data = cleaned
  })
}

export function FarmerPortalTheme({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    removeEmojiFromText(root)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData') removeEmojiFromText(mutation.target)
        mutation.addedNodes.forEach(removeEmojiFromText)
      })
    })

    observer.observe(root, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [])

  return <div ref={rootRef} className="farmer-portal-theme">{children}</div>
}
