'use client'

import { useState, useRef, useCallback } from 'react'
import { getPriceComparison, type StorePrice } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Scale, ExternalLink, Crown, Store, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'

interface PriceComparisonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameTitle: string
}

const FETCH_TIMEOUT = 15000 // 15 seconds

export function PriceComparisonDialog({
  open,
  onOpenChange,
  gameTitle,
}: PriceComparisonDialogProps) {
  const [prices, setPrices] = useState<StorePrice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchIdRef = useRef(0)

  const fetchPrices = useCallback(async (title: string) => {
    const id = ++fetchIdRef.current
    setLoading(true)
    setError(null)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

      const data = await getPriceComparison(title)
      clearTimeout(timeoutId)

      if (fetchIdRef.current !== id) return

      if (Array.isArray(data)) {
        setPrices(data)
        if (data.length === 0) {
          setError('Nessun prezzo trovato per questo gioco')
        }
      } else {
        setError('Risposta non valida dal server')
      }
    } catch (err) {
      if (fetchIdRef.current !== id) return
      const msg = err instanceof Error && err.name === 'AbortError'
        ? 'La richiesta è scaduta. Riprova.'
        : 'Errore durante il recupero dei prezzi'
      setError(msg)
    } finally {
      if (fetchIdRef.current === id) setLoading(false)
    }
  }, [])

  function handleOpenChange(value: boolean) {
    if (value && gameTitle) {
      setPrices([])
      setError(null)
      fetchPrices(gameTitle)
    } else if (!value) {
      setPrices([])
      setError(null)
      fetchIdRef.current++
    }
    onOpenChange(value)
  }

  function handleRetry() {
    if (gameTitle) {
      setPrices([])
      setError(null)
      fetchPrices(gameTitle)
    }
  }

  const hasMultipleStores = prices.length > 1

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Confronta Prezzi
          </DialogTitle>
          <DialogDescription className="line-clamp-1">
            {gameTitle}
          </DialogDescription>
        </DialogHeader>

        {/* Content area with min height for consistent layout */}
        <div className="min-h-[200px]">
          {loading ? (
            <div className="space-y-3 py-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border"
                >
                  <Skeleton className="h-8 w-24 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-10 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-sm text-center font-medium">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Riprova
              </Button>
            </div>
          ) : (
            <ScrollArea className="max-h-80 pr-1">
              <div className="space-y-2">
                {prices.map((store, index) => {
                  const isCheapest = index === 0 && hasMultipleStores
                  const isFree = parseFloat(store.price) === 0
                  const savingsPercent = store.savings

                  return (
                    <div
                      key={store.storeID}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isCheapest
                          ? 'border-primary/40 bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      {/* Store badge */}
                      <Badge
                        className="text-white text-xs px-2.5 py-1 border-0 shrink-0 font-semibold"
                        style={{ backgroundColor: store.color }}
                      >
                        {store.storeName}
                      </Badge>

                      {/* Price + Savings */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          {isFree ? (
                            <span className="text-base font-bold text-green-500">
                              GRATIS
                            </span>
                          ) : (
                            <>
                              {store.normalPrice !== store.price && (
                                <span className="text-xs line-through text-muted-foreground">
                                  {parseFloat(store.normalPrice).toFixed(2)}&thinsp;&euro;
                                </span>
                              )}
                              <span
                                className={`text-base font-bold ${
                                  isCheapest ? 'text-primary' : ''
                                }`}
                              >
                                {parseFloat(store.price).toFixed(2)}&thinsp;&euro;
                              </span>
                            </>
                          )}

                          {isCheapest && hasMultipleStores && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] gap-0.5 px-1.5 py-0"
                            >
                              <Crown className="h-2.5 w-2.5 text-yellow-500" />
                              Miglior prezzo
                            </Badge>
                          )}
                        </div>
                        {savingsPercent > 0 && (
                          <span className="text-[11px] text-green-500 font-medium">
                            -{savingsPercent}%
                          </span>
                        )}
                      </div>

                      {/* External link */}
                      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" asChild>
                        <a
                          href={store.dealUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Acquista su ${store.storeName}`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Summary footer */}
        {!loading && !error && prices.length > 1 && (
          <div className="text-[11px] text-muted-foreground text-center border-t border-border pt-3">
            Prezzi ordinati dal più economico · {prices.length} negozi trovati
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
