'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { getSettings, setSetting } from '@/lib/api'
import { THEMES } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Key, Gamepad2, Check, Save, Info, Shield } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsView() {
  const { currentTheme, setCurrentTheme } = useAppStore()

  // Settings state
  const [rawgApiKey, setRawgApiKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSettings()
      .then(settings => {
        if (settings.rawg_api_key) setRawgApiKey(settings.rawg_api_key)
      })
      .catch(() => {
        toast.error('Errore nel caricamento delle impostazioni')
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSaveApiKey() {
    if (!rawgApiKey.trim()) {
      toast.error('La RAWG API Key non può essere vuota')
      return
    }
    setSaving(true)
    try {
      await setSetting('rawg_api_key', rawgApiKey.trim())
      toast.success('RAWG API Key salvata con successo')
    } catch {
      toast.error('Errore nel salvataggio della RAWG API Key')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Impostazioni</h1>
        <p className="text-muted-foreground mt-1">Gestisci le tue preferenze e le chiavi API</p>
      </div>

      {/* Theme Selector Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Tema
          </CardTitle>
          <CardDescription>Scegli il tema visivo per GameVault</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {THEMES.map(theme => {
              const isActive = currentTheme === theme.value
              return (
                <button
                  key={theme.value}
                  onClick={() => setCurrentTheme(theme.value)}
                  className={`relative rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
                    isActive
                      ? 'border-primary shadow-md'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  {/* Preview */}
                  <div
                    className="h-16 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden"
                    style={{ backgroundColor: theme.preview.bg }}
                  >
                    <div
                      className="h-6 w-6 rounded-full"
                      style={{ backgroundColor: theme.preview.accent }}
                    />
                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <div
                          className="h-5 w-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: theme.preview.accent }}
                        >
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{theme.label}</p>
                    {isActive && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                        Attivo
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{theme.description}</p>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* API Key Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="h-5 w-5" />
            Chiavi API
          </CardTitle>
          <CardDescription>
            Configura le chiavi API necessarie per le integrazioni con servizi esterni
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* RAWG API Key */}
          <div className="space-y-2">
            <Label htmlFor="rawg-key" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              RAWG API Key
            </Label>
            <p className="text-sm text-muted-foreground">
              Necessaria per il calendario delle uscite. Ottienila gratuitamente da{' '}
              <a
                href="https://rawg.io/apidocs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                rawg.io/apidocs
              </a>
            </p>
            <div className="flex gap-2">
              <Input
                id="rawg-key"
                type="password"
                placeholder="Inserisci la tua RAWG API Key"
                value={rawgApiKey}
                onChange={e => setRawgApiKey(e.target.value)}
                disabled={loading}
              />
              <Button
                onClick={handleSaveApiKey}
                disabled={saving || loading || !rawgApiKey.trim()}
                className="shrink-0 gap-2"
              >
                {saving ? (
                  <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salva
              </Button>
            </div>
            {rawgApiKey && (
              <p className="text-xs text-success flex items-center gap-1">
                <Check className="h-3 w-3" />
                Chiave configurata
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* About Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5" />
            Informazioni
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
              <Gamepad2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">GameVault</h3>
              <p className="text-xs text-muted-foreground">News & Calendar</p>
            </div>
          </div>
          <Separator />
          <p className="text-sm text-muted-foreground leading-relaxed">
            GameVault è il tuo aggregatore di notizie gaming e calendario delle uscite PC.
            Raccoglie articoli dalle migliori fonti italiane e ti tiene aggiornato sulle
            prossime uscite con la possibilità di seguire i giochi che ti interessano.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Versione 2.0.0</span>
            <Badge variant="outline" className="text-[10px]">
              Italiano 🇮🇹
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
