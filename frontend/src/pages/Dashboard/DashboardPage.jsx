import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Skeleton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Lightbulb as LightbulbIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  OpenInNew as OpenInNewIcon,
  Edit as EditIcon,
  Link as LinkIcon,
} from '@mui/icons-material'
import { insightsService, categoriesService } from '../../services/insightsService'
import { useNavigate } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'

function formatDate(str) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

/* ---------- Insights Panel ---------- */
function InsightsPanel({ insights, loading, categoryName, onOpenEditor, selected, onSelect }) {
  useEffect(() => {
    onSelect(insights[0] || null)
  }, [insights]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 1.75,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LightbulbIcon color="primary" fontSize="small" />
          <Typography variant="caption" fontWeight={700} letterSpacing={1} textTransform="uppercase">
            INSIGHTS
          </Typography>
        </Box>
      </Box>

      {/* Insight list (sidebar within panel) */}
      {loading ? (
        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={56} />
          ))}
        </Box>
      ) : insights.length === 0 ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            p: 3,
            color: 'text.disabled',
          }}
        >
          <LightbulbIcon sx={{ fontSize: 48, opacity: 0.3 }} />
          <Typography variant="body2" textAlign="center">
            No hay insights publicados para {categoryName}
          </Typography>
          {onOpenEditor && (
            <Button size="small" variant="outlined" onClick={onOpenEditor}>
              Crear insight
            </Button>
          )}
        </Box>
      ) : (
        <>
          {/* Tabs: list of insight titles */}
          <Box
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              maxHeight: 140,
              overflowY: 'auto',
            }}
          >
            {insights.map((ins) => (
              <Box
                key={ins.id}
                onClick={() => onSelect(ins)}
                sx={{
                  px: 2.5,
                  py: 1.25,
                  cursor: 'pointer',
                  borderLeft: '3px solid',
                  borderColor: selected?.id === ins.id ? 'primary.main' : 'transparent',
                  bgcolor: selected?.id === ins.id ? 'primary.50' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                  transition: 'all 0.15s',
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={selected?.id === ins.id ? 700 : 500}
                  noWrap
                  color={selected?.id === ins.id ? 'primary.main' : 'text.primary'}
                >
                  {ins.title}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {formatDate(ins.published_at || ins.created_at)}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Selected insight content */}
          {selected && (
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  {selected.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PersonIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.secondary">
                      {selected.author_name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(selected.published_at || selected.created_at)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider />

              {selected.content ? (
                <Typography variant="body2" color="text.secondary" lineHeight={1.8} sx={{ whiteSpace: 'pre-wrap' }}>
                  {selected.content}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.disabled" fontStyle="italic">
                  Sin contenido narrativo.
                </Typography>
              )}
            </Box>
          )}
        </>
      )}

      {onOpenEditor && insights.length > 0 && (
        <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            fullWidth
            size="small"
            variant="outlined"
            endIcon={<OpenInNewIcon fontSize="small" />}
            onClick={onOpenEditor}
            sx={{ fontSize: 12 }}
          >
            Ver todos los insights
          </Button>
        </Box>
      )}
    </Paper>
  )
}

/* ---------- Power BI Panel ---------- */
function PowerBIPanel({ url, loading }) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {loading ? (
        <Skeleton variant="rectangular" sx={{ flex: 1, minHeight: 400 }} />
      ) : url ? (
        <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative', width: '100%', minHeight: 400 }}>
          <Box
            component="iframe"
            src={url}
            title="Power BI Dashboard"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '125%',
              height: '125%',
              border: 'none',
              transform: 'scale(0.8)',
              transformOrigin: 'top left',
            }}
            allowFullScreen
          />
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 1.5,
            minHeight: 400,
            color: 'text.disabled',
            bgcolor: 'action.hover',
          }}
        >
          <TrendingUpIcon sx={{ fontSize: 64, opacity: 0.2 }} />
          <Typography variant="h6" fontWeight={600}>
            Vista de Datos
          </Typography>
          <Typography variant="body2" textAlign="center" maxWidth={320}>
            Configure la URL de origen de datos para esta categoría usando el botón de edición junto a la pestaña activa.
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

/* ---------- Edit URL Dialog ---------- */
function EditUrlDialog({ open, onClose, category, onSaved }) {
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setUrl(category?.powerbi_url || '')
  }, [open, category])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await categoriesService.update(category.id, { powerbi_url: url.trim() || null })
      onSaved(res.data)
      onClose()
    } catch {
      // silently ignore — user can retry
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LinkIcon color="primary" />
        URL de Power BI — {category?.name}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label="URL de Power BI"
          placeholder="https://app.powerbi.com/reportEmbed?..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          multiline
          minRows={3}
          sx={{ mt: 1 }}
          helperText="Pega la URL de integración (embed) de Power BI. Déjala vacía para ocultar el panel."
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={14} /> : null}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

/* ---------- Main Page ---------- */
export default function DashboardPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const { can } = usePermissions()

  const [categories, setCategories] = useState([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [insights, setInsights] = useState([])
  const [selectedInsight, setSelectedInsight] = useState(null)
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [insightsOpen, setInsightsOpen] = useState(true)

  // Load categories once
  useEffect(() => {
    setLoadingMeta(true)
    categoriesService
      .list()
      .then((res) => setCategories(res.data))
      .catch(() => { })
      .finally(() => setLoadingMeta(false))
  }, [])

  // Load insights when active category changes
  useEffect(() => {
    const cat = categories[activeIdx]
    if (!cat) return
    setLoadingInsights(true)
    insightsService
      .list({ category_id: cat.id, status: 'published', limit: 10 })
      .then((res) => setInsights(res.data))
      .catch(() => setInsights([]))
      .finally(() => setLoadingInsights(false))
  }, [categories, activeIdx])

  const currentCategory = categories[activeIdx]

  // Power BI URL: selected insight overrides category URL
  const powerbiUrl = selectedInsight?.powerbi_url || currentCategory?.powerbi_url || null

  const displayCategories = loadingMeta
    ? ['Cargando...']
    : categories.length
      ? categories.map((c) => c.name)
      : ['Sin categorías']

  const canEditCategories = can('categories', 'write')

  // When a category is saved from the dialog, update local state
  const handleCategorySaved = (updatedCat) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCat.id ? updatedCat : c))
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Subheader */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          px: { xs: 2, md: 4 },
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            alignItems: { lg: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="overline"
              color="primary"
              fontWeight={700}
              letterSpacing={3}
              display="block"
            >
              SALA DE CONTROL
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Visión general operativa en tiempo real del portafolio inmobiliario.
            </Typography>
          </Box>

          {/* Category tabs */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'action.hover',
              borderRadius: 2,
              p: 0.5,
              gap: 0.5,
              flexWrap: 'wrap',
            }}
          >
            {loadingMeta ? (
              [1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="rounded" width={110} height={32} />
              ))
            ) : (
              displayCategories.map((cat, i) => (
                <Box key={cat} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button
                    size="small"
                    variant={activeIdx === i ? 'contained' : 'text'}
                    onClick={() => setActiveIdx(i)}
                    disabled={loadingMeta}
                    sx={{
                      fontSize: 13,
                      px: 2,
                      py: 0.75,
                      borderRadius: canEditCategories && activeIdx === i ? '6px 0 0 6px' : 1.5,
                      color: activeIdx === i ? 'white' : 'text.secondary',
                      boxShadow: activeIdx === i ? 2 : 0,
                      minWidth: 0,
                    }}
                  >
                    {cat}
                  </Button>
                  {/* Edit URL button — only on the active tab and for users with write permission */}
                  {canEditCategories && activeIdx === i && (
                    <Tooltip title="Configurar URL de Power BI">
                      <IconButton
                        size="small"
                        onClick={() => setEditDialogOpen(true)}
                        sx={{
                          bgcolor: 'primary.main',
                          color: '#fff',
                          borderRadius: '0 6px 6px 0',
                          height: 32,
                          width: 28,
                          '&:hover': { bgcolor: 'primary.dark' },
                        }}
                      >
                        <EditIcon sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              ))
            )}

            {!loadingMeta && (
              <>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />
                <Tooltip title={insightsOpen ? "Ocultar panel de insights" : "Ver panel de insights"}>
                  <IconButton
                    size="small"
                    onClick={() => setInsightsOpen(!insightsOpen)}
                    sx={{
                      color: insightsOpen ? 'primary.main' : 'text.secondary',
                      bgcolor: insightsOpen ? 'primary.50' : 'transparent',
                    }}
                  >
                    <LightbulbIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          p: { xs: 1.5, md: 2 },
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          overflow: 'hidden',
          bgcolor: 'background.default',
        }}
      >
        {/* Insights panel */}
        {insightsOpen && (
          <Box
            sx={{
              width: { xs: '100%', md: 350 },
              flexShrink: 0,
              order: { xs: 2, md: 1 }
            }}
          >
            <InsightsPanel
              insights={insights}
              loading={loadingInsights}
              categoryName={currentCategory?.name || ''}
              onOpenEditor={can('insights', 'write') ? () => navigate('/insights') : null}
              selected={selectedInsight}
              onSelect={setSelectedInsight}
            />
          </Box>
        )}

        {/* Power BI panel */}
        <Box sx={{ flex: 1, display: 'flex', order: { xs: 1, md: 2 }, minHeight: { xs: 600, md: 0 }, minWidth: 0 }}>
          <PowerBIPanel url={powerbiUrl} loading={loadingMeta} />
        </Box>
      </Box>

      {/* Edit URL Dialog */}
      <EditUrlDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        category={currentCategory}
        onSaved={handleCategorySaved}
      />
    </Box>
  )
}
