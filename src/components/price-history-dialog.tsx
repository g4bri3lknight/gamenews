'use client'

import { useState, useRef, useCallback } from 'react'
import { getPriceHistory, type PriceHistory } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  TrendingDown,
  ArrowDown,
  ArrowUp,
  Minus,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'

interface PriceHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameTitle: string
  steamAppID?: string
}

const FETCH_TIMEOUT = 15000 // 15 seconds

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ payload: { price: number; store: string } }>
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null

  const data = payload[0].payload
  const date = label
    ? new Date(label).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : ''

  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-md text-xs">
      <p className="text-muted-foreground mb-1">{date}</p>
      <p className="font-semibold">
        {data.price.toFixed(2)}&thinsp;&euro;
      </p>
      <p className="text-muted-foreground">{data.store}</p>
    </div>
  )
}

export function PriceHistoryDialog({
  open,
  onOpenChange,
  gameTitle,
  steamAppID,
}: PriceHistoryDialogProps) {
  const [history, setHistory] = useState<PriceHistory | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchIdRef = useRef(0)

  const fetchHistoryData = useCallback(async (title: string, appId: string) => {
    const id = ++fetchIdRef.current
    setLoading(true)
    setError(null)
    setHistory(null)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

      const data = await getPriceHistory({
        title: title || undefined,
        steamAppID: appId || undefined,
      })
      clearTimeout(timeoutId)

      if (fetchIdRef.current !== id) return

      if (data && data.dataPoints && data.dataPoints.length > 0) {
        setHistory(data)
      } else {
        setError('Nessun dato sulla cronologia dei prezzi per questo gioco')
      }
    } catch (err) {
      if (fetchIdRef.current !== id) return
      const msg = err instanceof Error && err.name === 'AbortError'
        ? 'La richiesta è scaduta. Riprova.'
        : 'Errore durante il recupero della cronologia'
      setError(msg)
    } finally {
      if (fetchIdRef.current === id) setLoading(false)
    }
  }, [])

  function handleOpenChange(value: boolean) {
    if (value && (gameTitle || steamAppID)) {
      setHistory(null)
      setError(null)
      fetchHistoryData(gameTitle, steamAppID || '')
    } else if (!value) {
      setHistory(null)
      setError(null)
      fetchIdRef.current++
    }
    onOpenChange(value)
  }

  function handleRetry() {
    if (gameTitle || steamAppID) {
      setHistory(null)
      setError(null)
      fetchHistoryData(gameTitle, steamAppID || '')
    }
  }

  // Prepare chart data - deduplicate by date (keep lowest price per date)
  const chartData = history
    ? history.dataPoints.reduce(
        (acc, dp) => {
          const dateKey = dp.date.split('T')[0]
          const existing = acc.find((item) => item.date === dateKey)
          if (existing) {
            if (dp.price < existing.price) {
              existing.price = dp.price
              existing.store = dp.store
            }
          } else {
            acc.push({
              ...dp,
              date: dateKey,
            })
          }
          return acc
        },
        [] as Array<{ date: string; price: number; store: string }>,
      )
    : []

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Cronologia Prezzi
          </DialogTitle>
          <DialogDescription className="line-clamp-1">
            {history?.gameTitle || gameTitle}
          </DialogDescription>
        </DialogHeader>

        {/* Content area with min height for consistent layout */}
        <div className="min-h-[280px]">
          {loading ? (
            <div className="py-4 space-y-4">
              {/* Stats skeleton */}
              <div className="flex justify-center gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="text-center">
                    <Skeleton className="h-4 w-16 mx-auto mb-1" />
                    <Skeleton className="h-6 w-12 mx-auto" />
                  </div>
                ))}
              </div>
              {/* Chart skeleton */}
              <Skeleton className="w-full h-48 rounded-lg" />
            </div>
          ) : error ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-3">
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
          ) : history ? (
            <div className="space-y-4">
              {/* Price stats */}
              <div className="flex justify-center gap-6 text-center">
                {/* Lowest */}
                <div className="space-y-0.5">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                    <ArrowDown className="h-3 w-3 text-green-500" />
                    Minimo
                  </div>
                  <p className="text-lg font-bold text-green-500">
                    {history.lowestPrice.toFixed(2)}&thinsp;&euro;
                  </p>
                </div>

                {/* Current */}
                <div className="space-y-0.5">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                    <Minus className="h-3 w-3 text-primary" />
                    Attuale
                  </div>
                  <p className="text-lg font-bold text-primary">
                    {history.currentPrice.toFixed(2)}&thinsp;&euro;
                  </p>
                </div>

                {/* Highest */}
                <div className="space-y-0.5">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                    <ArrowUp className="h-3 w-3 text-red-500" />
                    Massimo
                  </div>
                  <p className="text-lg font-bold text-red-500">
                    {history.highestPrice.toFixed(2)}&thinsp;&euro;
                  </p>
                </div>
              </div>

              {/* Chart */}
              <div className="w-full h-56 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      opacity={0.4}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                      tickFormatter={(val: string) => {
                        const d = new Date(val)
                        return `${d.getDate()}/${d.getMonth() + 1}`
                      }}
                      axisLine={{ stroke: 'var(--color-border)' }}
                      tickLine={false}
                      dy={8}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                      tickFormatter={(val: number) => `${val}€`}
                      axisLine={false}
                      tickLine={false}
                      dx={-4}
                      width={44}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {history.lowestPrice > 0 && (
                      <ReferenceLine
                        y={history.lowestPrice}
                        stroke="var(--color-green-500, #22c55e)"
                        strokeDasharray="4 4"
                        strokeWidth={1}
                        opacity={0.6}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="var(--color-chart-1)"
                      strokeWidth={2.5}
                      dot={chartData.length <= 20}
                      activeDot={{
                        r: 5,
                        fill: 'var(--color-chart-1)',
                        stroke: 'var(--color-background)',
                        strokeWidth: 2,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Data points count */}
              <p className="text-[11px] text-muted-foreground text-center">
                {history.dataPoints.length} punti dati · Prezzi da vari negozi
              </p>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
