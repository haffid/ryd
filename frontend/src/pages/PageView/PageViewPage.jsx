import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  Lightbulb as LightbulbIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  OpenInNew as OpenInNewIcon,
  Edit as EditIcon,
  Link as LinkIcon,
  PictureAsPdf as PdfIcon,
  Upload as UploadIcon,
} from '@mui/icons-material'
import { pagesService } from '../../services/pagesService'
import { insightsService } from '../../services/insightsService'
import { documentsService } from '../../services/documentsService'
import { usePermissions } from '../../hooks/usePermissions'

function formatDate(str) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function flattenPages(list, result = []) {
  for (const p of list) {
    result.push(p)
    if (p.children?.length) flattenPages(p.children, result)
  }
  return result
}

/* ---------- Insights Panel ---------- */
function InsightsPanel({ insights, loading, onOpenEditor, selected, onSelect }) {
  useEffect(() => {
    onSelect(insights[0] || null)
  }, [insights]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid', borderColor: 'divider', borderRadius: 2,
        display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider',
          bgcolor: 'action.hover', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LightbulbIcon color="primary" fontSize="small" />
          <Typography variant="caption" fontWeight={700} letterSpacing={1} textTransform="uppercase">
            Insights Estratégicos
          </Typography>
        </Box>
        <Chip label="EN VIVO" size="small" color="primary" sx={{ fontSize: 10, height: 20 }} />
      </Box>

      {loading ? (
        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={56} />)}
        </Box>
      ) : insights.length === 0 ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 3, color: 'text.disabled' }}>
          <LightbulbIcon sx={{ fontSize: 48, opacity: 0.3 }} />
          <Typography variant="body2" textAlign="center">No hay insights publicados</Typography>
          {onOpenEditor && (
            <Button size="small" variant="outlined" onClick={onOpenEditor}>Crear insight</Button>
          )}
        </Box>
      ) : (
        <>
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', maxHeight: 140, overflowY: 'auto' }}>
            {insights.map((ins) => (
              <Box
                key={ins.id}
                onClick={() => onSelect(ins)}
                sx={{
                  px: 2.5, py: 1.25, cursor: 'pointer', borderLeft: '3px solid',
                  borderColor: selected?.id === ins.id ? 'primary.main' : 'transparent',
                  bgcolor: selected?.id === ins.id ? 'primary.50' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' }, transition: 'all 0.15s',
                }}
              >
                <Typography variant="body2" fontWeight={selected?.id === ins.id ? 700 : 500} noWrap
                  color={selected?.id === ins.id ? 'primary.main' : 'text.primary'}>
                  {ins.title}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {formatDate(ins.published_at || ins.created_at)}
                </Typography>
              </Box>
            ))}
          </Box>
          {selected && (
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>{selected.title}</Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PersonIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.secondary">{selected.author_name}</Typography>
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
                <Typography variant="body2" color="text.disabled" fontStyle="italic">Sin contenido narrativo.</Typography>
              )}
            </Box>
          )}
        </>
      )}
      {onOpenEditor && insights.length > 0 && (
        <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button fullWidth size="small" variant="outlined" endIcon={<OpenInNewIcon fontSize="small" />}
            onClick={onOpenEditor} sx={{ fontSize: 12 }}>
            Ver todos los insights
          </Button>
        </Box>
      )}
    </Paper>
  )
}

/* ---------- Power BI edit dialog ---------- */
function EditUrlDialog({ open, onClose, page, onSaved }) {
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setUrl(page?.powerbi_url || '')
  }, [open, page])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await pagesService.update(page.id, { powerbi_url: url.trim() || null })
      onSaved(res.data)
      onClose()
    } catch {
      // silently ignore
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LinkIcon color="primary" />URL de Power BI — {page?.name}
      </DialogTitle>
      <DialogContent>
        <TextField autoFocus fullWidth label="URL de Power BI"
          placeholder="https://app.powerbi.com/reportEmbed?..."
          value={url} onChange={(e) => setUrl(e.target.value)}
          multiline minRows={3} sx={{ mt: 1 }}
          helperText="Pega la URL embed de Power BI. Déjala vacía para ocultar el panel." />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}
          startIcon={saving ? <CircularProgress size={14} /> : null}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

/* ---------- Narrative layout (PDF viewer) ---------- */
function NarrativeView({ currentPage, canWrite, navigate }) {
  const [document, setDocument] = useState(null)
  const [loadingDoc, setLoadingDoc] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const fileInputRef = useState(null)

  useEffect(() => {
    setLoadingDoc(true)
    documentsService.getByPage(currentPage.id)
      .then((res) => setDocument(res.data))
      .catch(() => setDocument(null))
      .finally(() => setLoadingDoc(false))
  }, [currentPage.id])

  useEffect(() => {
    if (uploadOpen) {
      setTitle(document?.title || currentPage.name)
      setDescription(document?.description || currentPage.description || '')
      setFile(null)
    }
  }, [uploadOpen, document, currentPage])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.type === 'application/pdf' || dropped?.name?.endsWith('.pdf')) setFile(dropped)
  }

  const handleUpload = async () => {
    if (!file && !document) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', title.trim() || currentPage.name)
      fd.append('description', description.trim())
      fd.append('page_id', String(currentPage.id))
      if (file) fd.append('file', file)

      let res
      if (document && !file) {
        res = await documentsService.update(document.id, {
          title: title.trim(),
          description: description.trim() || null,
        })
      } else {
        res = await documentsService.upload(fd)
      }
      setDocument(res.data)
      setUploadOpen(false)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const pdfUrl = document?.file_url || null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Subheader */}
      <Box sx={{ bgcolor: 'background.paper', px: { xs: 2, md: 4 }, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <PdfIcon color="error" fontSize="small" />
              <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={3}>
                {currentPage.name.toUpperCase()}
              </Typography>
            </Box>
            {currentPage.description && (
              <Typography variant="body1" color="text.secondary" maxWidth={700}>
                {currentPage.description}
              </Typography>
            )}
          </Box>
          {canWrite && (
            <Tooltip title={document ? 'Actualizar documento' : 'Subir PDF'}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<UploadIcon />}
                onClick={() => setUploadOpen(true)}
              >
                {document ? 'Actualizar PDF' : 'Subir PDF'}
              </Button>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* PDF viewer — full width */}
      <Box sx={{ flex: 1, p: { xs: 1, md: 2 }, bgcolor: 'background.default', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {loadingDoc ? (
          <Skeleton variant="rectangular" sx={{ flex: 1, minHeight: 500, borderRadius: 2 }} />
        ) : pdfUrl ? (
          <Paper
            elevation={0}
            sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            {/* PDF toolbar */}
            <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PdfIcon sx={{ color: 'error.main', fontSize: 18 }} />
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  {document?.original_name || document?.title}
                </Typography>
              </Box>
              <Tooltip title="Abrir en nueva pestaña">
                <IconButton size="small" href={pdfUrl} target="_blank" rel="noopener">
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            {/* Iframe PDF viewer */}
            <Box
              component="iframe"
              src={pdfUrl}
              title={currentPage.name}
              sx={{ flex: 1, border: 'none', width: '100%', minHeight: 500 }}
            />
          </Paper>
        ) : (
          <Box
            sx={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 2, minHeight: 400, color: 'text.disabled',
              bgcolor: 'action.hover', borderRadius: 2, border: '2px dashed', borderColor: 'divider',
            }}
          >
            <PdfIcon sx={{ fontSize: 72, opacity: 0.2 }} />
            <Typography variant="h6" fontWeight={600}>Sin documento</Typography>
            <Typography variant="body2" textAlign="center" maxWidth={320}>
              {canWrite
                ? 'Sube un PDF para esta página usando el botón "Subir PDF" en la parte superior.'
                : 'El documento aún no ha sido configurado.'}
            </Typography>
            {canWrite && (
              <Button variant="contained" startIcon={<UploadIcon />} onClick={() => setUploadOpen(true)}>
                Subir PDF
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PdfIcon color="error" />
          {document ? 'Actualizar documento' : 'Subir PDF'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {/* Drop zone */}
          <Box
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => {
              const input = window.document.createElement('input')
              input.type = 'file'
              input.accept = '.pdf,application/pdf'
              input.onchange = (e) => setFile(e.target.files[0])
              input.click()
            }}
            sx={{
              border: '2px dashed',
              borderColor: dragging ? 'primary.main' : file ? 'success.main' : 'divider',
              borderRadius: 2, p: 3, textAlign: 'center', cursor: 'pointer',
              bgcolor: dragging ? 'primary.50' : file ? 'success.50' : 'action.hover',
              transition: 'all 0.15s',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
            }}
          >
            {file ? (
              <>
                <PdfIcon sx={{ fontSize: 32, color: 'success.main', mb: 0.5 }} />
                <Typography variant="body2" fontWeight={600} color="success.main">{file.name}</Typography>
              </>
            ) : document ? (
              <>
                <PdfIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  Actual: <strong>{document.original_name}</strong>
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Arrastra un nuevo PDF para reemplazarlo, o cierra para editar solo los datos.
                </Typography>
              </>
            ) : (
              <>
                <UploadIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  Arrastra un PDF aquí o <strong>haz clic para seleccionar</strong>
                </Typography>
              </>
            )}
          </Box>

          <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth size="small" />
          <TextField label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)}
            fullWidth size="small" multiline minRows={2} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUploadOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleUpload} disabled={saving || (!file && !document)}
            startIcon={saving ? <CircularProgress size={14} /> : <UploadIcon />}>
            {document ? 'Guardar cambios' : 'Subir PDF'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

/* ---------- Main Page ---------- */
export default function PageViewPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { can } = usePermissions()

  const [pageTree, setPageTree] = useState([])
  const [insights, setInsights] = useState([])
  const [selectedInsight, setSelectedInsight] = useState(null)
  const [loadingPages, setLoadingPages] = useState(true)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [activeChildIdx, setActiveChildIdx] = useState(0)
  const [editTarget, setEditTarget] = useState(null)
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    setLoadingPages(true)
    setActiveChildIdx(0)
    pagesService
      .list()
      .then((res) => setPageTree(res.data || []))
      .catch(() => setPageTree([]))
      .finally(() => setLoadingPages(false))
  }, [slug])

  const allPages = flattenPages(pageTree)
  const currentPage = allPages.find((p) => p.slug === slug)
  const children = (currentPage?.children || []).filter((c) => c.visibility === 'published')
  const hasChildren = children.length > 0
  const activeChild = hasChildren ? children[activeChildIdx] : null
  const baseUrl = activeChild?.powerbi_url || currentPage?.powerbi_url || null
  const powerbiUrl = selectedInsight?.powerbi_url || baseUrl

  useEffect(() => {
    setLoadingInsights(true)
    insightsService
      .list({ status: 'published', limit: 10 })
      .then((res) => setInsights(res.data || []))
      .catch(() => setInsights([]))
      .finally(() => setLoadingInsights(false))
  }, [slug, activeChildIdx])

  const canWrite = can('pages', 'write')

  const handlePageSaved = () => {
    pagesService.list().then((res) => setPageTree(res.data || [])).catch(() => {})
  }

  if (loadingPages) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Skeleton variant="rounded" height={60} />
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Skeleton variant="rounded" width="30%" height={500} />
          <Skeleton variant="rectangular" sx={{ flex: 1, height: 500 }} />
        </Box>
      </Box>
    )
  }

  if (!currentPage) {
    return (
      <Box sx={{ p: 6, textAlign: 'center' }}>
        <Typography variant="h6" color="text.disabled">Página no encontrada</Typography>
      </Box>
    )
  }

  // ── NARRATIVE: full-width PDF viewer, no Power BI, no insights panel ──
  if (currentPage.page_type === 'narrative') {
    return <NarrativeView currentPage={currentPage} canWrite={canWrite} navigate={navigate} />
  }

  // ── DASHBOARD: Power BI + insights panel ─────────────────────────────────
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Subheader */}
      <Box sx={{ bgcolor: 'background.paper', px: { xs: 2, md: 4 }, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, alignItems: { lg: 'center' }, justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={3} display="block">
              {currentPage.name.toUpperCase()}
            </Typography>
            {currentPage.description && (
              <Typography variant="body2" color="text.secondary">{currentPage.description}</Typography>
            )}
          </Box>

          {hasChildren && (
            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'action.hover', borderRadius: 2, p: 0.5, gap: 0.5, flexWrap: 'wrap' }}>
              {children.map((child, i) => (
                <Box key={child.id} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button
                    size="small"
                    variant={activeChildIdx === i ? 'contained' : 'text'}
                    onClick={() => { setActiveChildIdx(i); setSelectedInsight(null) }}
                    sx={{
                      fontSize: 13, px: 2, py: 0.75, minWidth: 0,
                      borderRadius: canWrite && activeChildIdx === i ? '6px 0 0 6px' : 1.5,
                      color: activeChildIdx === i ? 'white' : 'text.secondary',
                      boxShadow: activeChildIdx === i ? 2 : 0,
                    }}
                  >
                    {child.name}
                  </Button>
                  {canWrite && activeChildIdx === i && (
                    <Tooltip title="Configurar URL de Power BI">
                      <IconButton size="small" onClick={() => { setEditTarget(child); setEditOpen(true) }}
                        sx={{ bgcolor: 'primary.main', color: '#fff', borderRadius: '0 6px 6px 0', height: 32, width: 28, '&:hover': { bgcolor: 'primary.dark' } }}>
                        <EditIcon sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              ))}
            </Box>
          )}

          {!hasChildren && canWrite && (
            <Tooltip title="Configurar URL de Power BI">
              <IconButton size="small" onClick={() => { setEditTarget(currentPage); setEditOpen(true) }}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, overflow: 'hidden', bgcolor: 'background.default' }}>
        <Box sx={{ width: { md: '30%' }, minWidth: { md: 280 }, order: { xs: 1, md: 0 } }}>
          <InsightsPanel
            insights={insights} loading={loadingInsights}
            onOpenEditor={can('insights', 'write') ? () => navigate('/insights') : null}
            selected={selectedInsight} onSelect={setSelectedInsight}
          />
        </Box>
        <Box sx={{ flex: 1, display: 'flex', order: { xs: 2, md: 1 }, minHeight: { xs: 400, md: 0 } }}>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {powerbiUrl ? (
              <Box component="iframe" src={powerbiUrl} title={activeChild?.name || currentPage.name}
                sx={{ flex: 1, border: 'none', width: '100%', minHeight: 400 }} allowFullScreen />
            ) : (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1.5, minHeight: 400, color: 'text.disabled', bgcolor: 'action.hover' }}>
                <TrendingUpIcon sx={{ fontSize: 64, opacity: 0.2 }} />
                <Typography variant="h6" fontWeight={600}>Tablero Power BI</Typography>
                <Typography variant="body2" textAlign="center" maxWidth={320}>
                  {canWrite ? `Configure la URL de Power BI usando el botón ✏ junto a "${activeChild?.name || currentPage.name}".` : 'El tablero aún no está configurado.'}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      <EditUrlDialog open={editOpen} onClose={() => setEditOpen(false)} page={editTarget} onSaved={handlePageSaved} />
    </Box>
  )
}
