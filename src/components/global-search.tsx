'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useGlobalSearch, type SearchResult } from '@/hooks/use-global-search'
import {
  Newspaper,
  Percent,
  Gift,
  CalendarDays,
  ExternalLink,
  Search,
} from 'lucide-react'

// ============================================
// GLOBAL SEARCH DIALOG
// ============================================

interface GlobalSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ResultIcon({ type }: { type: SearchResult['type'] }) {
  switch (type) {
    case 'news':
      return <Newspaper className="h-4 w-4 text-rose-500" />
    case 'deal':
      return <Percent className="h-4 w-4 text-amber-500" />
    case 'free':
      return <Gift className="h-4 w-4 text-emerald-500" />
    case 'release':
      return <CalendarDays className="h-4 w-4 text-indigo-500" />
  }
}

function LoadingSkeleton() {
  return (
    <div className="p-2 space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2">
          <Skeleton className="h-4 w-4 rounded" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const [query, setQuery] = useState('')
  const { results, loading } = useGlobalSearch(query, open)

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      // Small delay to avoid visual glitch during close animation
      const t = setTimeout(() => setQuery(''), 200)
      return () => clearTimeout(t)
    }
  }, [open])

  const groupByType = useCallback((items: SearchResult[]) => {
    const groups: Record<string, { heading: string; icon: React.ReactNode; items: SearchResult[] }> = {
      news: { heading: 'Notizie', icon: <Newspaper className="h-4 w-4" />, items: [] },
      deal: { heading: 'Offerte', icon: <Percent className="h-4 w-4" />, items: [] },
      free: { heading: 'Giochi Gratis', icon: <Gift className="h-4 w-4" />, items: [] },
      release: { heading: 'Uscite', icon: <CalendarDays className="h-4 w-4" />, items: [] },
    }

    for (const item of items) {
      if (groups[item.type]) {
        groups[item.type].items.push(item)
      }
    }

    return Object.entries(groups).filter(([, group]) => group.items.length > 0)
  }, [])

  const hasQuery = query.trim().length > 0

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Ricerca Globale"
      description="Cerca notizie, offerte, giochi gratis e uscite"
    >
      <CommandInput
        placeholder="Cerca giochi, notizie, offerte..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {!hasQuery && !loading && (
          <div className="py-8 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Search className="h-8 w-8 opacity-40" />
            <p className="text-sm">Inizia a digitare per cercare...</p>
            <div className="flex flex-wrap gap-1.5 px-4 mt-1">
              <Badge variant="outline" className="text-[10px] gap-1">
                <Newspaper className="h-2.5 w-2.5" /> Notizie
              </Badge>
              <Badge variant="outline" className="text-[10px] gap-1">
                <Percent className="h-2.5 w-2.5" /> Offerte
              </Badge>
              <Badge variant="outline" className="text-[10px] gap-1">
                <Gift className="h-2.5 w-2.5" /> Gratis
              </Badge>
              <Badge variant="outline" className="text-[10px] gap-1">
                <CalendarDays className="h-2.5 w-2.5" /> Uscite
              </Badge>
            </div>
          </div>
        )}

        {hasQuery && loading && <LoadingSkeleton />}

        {hasQuery && !loading && results.length === 0 && (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2">
              <Search className="h-6 w-6 opacity-40" />
              <p className="text-sm">Nessun risultato per &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-muted-foreground">
                Prova con un termine diverso
              </p>
            </div>
          </CommandEmpty>
        )}

        {hasQuery && !loading && results.length > 0 && (
          <>
            {groupByType(results).map(([type, group], idx) => (
              <div key={type}>
                {idx > 0 && <CommandSeparator />}
                <CommandGroup heading={group.heading}>
                  {group.items.map((item, i) => (
                    <CommandItem
                      key={`${type}-${i}`}
                      className="flex items-center gap-3 cursor-pointer py-2.5"
                      onSelect={() => {
                        window.open(item.url, '_blank', 'noopener,noreferrer')
                      }}
                    >
                      <ResultIcon type={item.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.subtitle}
                        </p>
                      </div>
                      <Badge
                        className="text-[9px] font-semibold px-1.5 py-0 border-0 flex-shrink-0"
                        style={{ backgroundColor: item.badgeColor, color: '#fff' }}
                      >
                        {item.badge}
                      </Badge>
                      <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </div>
            ))}
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
