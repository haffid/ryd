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
  Folder as FolderIcon,
  Dashboard as DashboardIcon,
  TableView as TableViewIcon,
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
            INSIGHTS
          </Typography>
        </Box>
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
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Publicado el {formatDate(selected.published_at)} por {selected.author_name}
                  </Typography>
                </Box>
                <Divider />
                {selected.content && (
                  <Box
                    className="insight-content"
                    dangerouslySetInnerHTML={{ __html: selected.content }}
                    sx={{
                      mb: selected.powerbi_url ? 4 : 0,
                      color: 'text.primary',
                      fontSize: 15,
                      lineHeight: 1.7,
                      '& p': { mb: 2, mt: 0 },
                      '& ul, & ol': { mb: 2, pl: 3 },
                      '& h1, & h2, & h3': { mt: 3, mb: 1.5, fontWeight: 700 },
                      '& h1': { fontSize: '1.5rem' },
                      '& h2': { fontSize: '1.25rem' },
                      '& h3': { fontSize: '1.1rem' },
                      '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1, my: 2 },
                      '& a': { color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }
                    }}
                  />
                )}
              </Box>
            </Box>
          )}

          {onOpenEditor && insights.length > 0 && (
            <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button fullWidth size="small" variant="outlined" endIcon={<OpenInNewIcon fontSize="small" />}
                onClick={onOpenEditor} sx={{ fontSize: 12 }}>
                Ver todos los insights
              </Button>
            </Box>
          )}
        </>
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
        <LinkIcon color="primary" />URL de origen — {page?.name}
      </DialogTitle>
      <DialogContent>
        <TextField autoFocus fullWidth label="URL del reporte o documento"
          placeholder="https://app.powerbi.com/... o https://onedrive.live.com/..."
          value={url} onChange={(e) => setUrl(e.target.value)}
          multiline minRows={3} sx={{ mt: 1 }}
          helperText="Pega la URL de Power BI, Excel u origen de datos. Déjala vacía para ocultar el panel." />
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

/* ---------- Documents Panel ---------- */
function DocumentsPanel({ documents, loading, selected, onSelect }) {
  useEffect(() => {
    if (documents.length > 0 && !selected) {
      onSelect(documents[0])
    }
  }, [documents, selected, onSelect])

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
          bgcolor: 'action.hover', display: 'flex', alignItems: 'center', gap: 1,
        }}
      >
        <PdfIcon color="error" fontSize="small" />
        <Typography variant="caption" fontWeight={700} letterSpacing={1} textTransform="uppercase">
          DOCUMENTOS
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={56} />)}
        </Box>
      ) : documents.length === 0 ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 3, color: 'text.disabled' }}>
          <PdfIcon sx={{ fontSize: 48, opacity: 0.3 }} />
          <Typography variant="body2" textAlign="center">No hay documentos publicados</Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {documents.map((doc) => (
            <Box
              key={doc.id}
              onClick={() => onSelect(doc)}
              sx={{
                px: 2.5, py: 1.25, cursor: 'pointer', borderLeft: '3px solid',
                borderColor: selected?.id === doc.id ? 'error.main' : 'transparent',
                bgcolor: selected?.id === doc.id ? 'error.50' : 'transparent',
                '&:hover': { bgcolor: 'action.hover' }, transition: 'all 0.15s',
              }}
            >
              <Typography variant="body2" fontWeight={selected?.id === doc.id ? 700 : 500} noWrap
                color={selected?.id === doc.id ? 'error.main' : 'text.primary'}>
                {doc.title || doc.original_name}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }} noWrap>
                {doc.original_name}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  )
}

/* ---------- Narrative layout (PDF viewer) ---------- */
function NarrativeView({ currentPage, targetPage, canWrite, navigate, isSubView }) {
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [loadingDoc, setLoadingDoc] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoadingDoc(true)
    documentsService.list({ page_id: targetPage.id })
      .then((res) => {
        const docs = res.data || []
        setDocuments(docs)
        if (docs.length > 0) {
          setSelectedDocument(docs[0])
        } else {
          setSelectedDocument(null)
        }
      })
      .catch(() => setDocuments([]))
      .finally(() => setLoadingDoc(false))
  }, [targetPage.id])

  useEffect(() => {
    if (uploadOpen) {
      setTitle(targetPage.name)
      setDescription(targetPage.description || '')
      setFile(null)
    }
  }, [uploadOpen, targetPage])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.type === 'application/pdf' || dropped?.name?.endsWith('.pdf')) setFile(dropped)
  }

  const handleUpload = async () => {
    if (!file) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', title.trim() || targetPage.name)
      fd.append('description', description.trim())
      fd.append('page_id', String(targetPage.id))
      fd.append('file', file)

      const res = await documentsService.upload(fd)
      const newDoc = res.data

      // Append the new doc to the list and select it
      setDocuments(prev => [newDoc, ...prev])
      setSelectedDocument(newDoc)
      setUploadOpen(false)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const pdfUrl = selectedDocument?.file_url || null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Subheader */}
      {!isSubView && (
        <Box sx={{ bgcolor: 'background.paper', px: { xs: 2, md: 4 }, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, alignItems: { lg: 'center' }, justifyContent: 'space-between', gap: 2 }}>
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
              <Tooltip title="Subir nuevo PDF">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<UploadIcon />}
                  onClick={() => setUploadOpen(true)}
                >
                  Subir PDF
                </Button>
              </Tooltip>
            )}
          </Box>
        </Box>
      )}

      {/* Master-Detail Layout for PDF viewer */}
      <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, overflow: 'hidden', bgcolor: 'background.default' }}>

        {/* Left Side: Documents List */}
        <Box sx={{ width: { md: '30%' }, minWidth: { md: 280 }, order: { xs: 1, md: 0 } }}>
          <DocumentsPanel
            documents={documents}
            loading={loadingDoc}
            selected={selectedDocument}
            onSelect={setSelectedDocument}
          />
        </Box>

        {/* Right Side: PDF Viewer */}
        <Box sx={{ flex: 1, display: 'flex', order: { xs: 2, md: 1 }, minHeight: { xs: 500, md: 0 } }}>
          {loadingDoc ? (
            <Skeleton variant="rectangular" sx={{ flex: 1, borderRadius: 2 }} />
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
                    {selectedDocument?.original_name || selectedDocument?.title}
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
                title={selectedDocument?.title || targetPage.name}
                sx={{ flex: 1, border: 'none', width: '100%', minHeight: 500 }}
              />
            </Paper>
          ) : (
            <Paper
              elevation={0}
              sx={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 2, color: 'text.disabled',
                bgcolor: 'action.hover', borderRadius: 2, border: '1px dashed', borderColor: 'divider',
              }}
            >
              <PdfIcon sx={{ fontSize: 72, opacity: 0.2 }} />
              <Typography variant="h6" fontWeight={600}>Sin documento seleccionado</Typography>
              <Typography variant="body2" textAlign="center" maxWidth={320}>
                {canWrite
                  ? `Sube un PDF para "${targetPage.name}" usando el botón superior para visualizarlo aquí.`
                  : 'No hay documentos asignados a esta página.'}
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PdfIcon color="error" />
          Subir PDF
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
            ) : (
              <>
                <UploadIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  Arrastra un PDF aquí o <strong>haz clic para seleccionar</strong>
                </Typography>
              </>
            )}
          </Box>

          <TextField label="Título del documento" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth size="small" />
          <TextField label="Descripción opcional" value={description} onChange={(e) => setDescription(e.target.value)}
            fullWidth size="small" multiline minRows={2} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUploadOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleUpload} disabled={saving || !file}
            startIcon={saving ? <CircularProgress size={14} /> : <UploadIcon />}>
            Subir PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

/* ---------- Dashboard layout (Power BI + Insights) ---------- */
function DashboardView({ targetPage, currentPage, powerbiUrl, insights, loadingInsights, selectedInsight, setSelectedInsight, canWrite, navigate, insightsOpen }) {
  return (
    <Box sx={{ flex: 1, p: { xs: 1.5, md: 2 }, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, overflow: 'hidden', bgcolor: 'background.default' }}>
      {insightsOpen && (
        <Box sx={{ width: { xs: '100%', md: 450 }, flexShrink: 0, order: { xs: 2, md: 1 } }}>
          <InsightsPanel
            insights={insights} loading={loadingInsights}
            onOpenEditor={canWrite ? () => navigate('/insights') : null}
            selected={selectedInsight} onSelect={setSelectedInsight}
          />
        </Box>
      )}
      <Box sx={{ flex: 1, display: 'flex', order: { xs: 1, md: 2 }, minHeight: { xs: 600, md: 0 }, minWidth: 0 }}>
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {powerbiUrl ? (
            <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative', width: '100%', minHeight: 400 }}>
              <Box
                component="iframe"
                src={powerbiUrl}
                title={targetPage?.name || currentPage.name}
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
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1.5, minHeight: 400, color: 'text.disabled', bgcolor: 'action.hover' }}>
              <TrendingUpIcon sx={{ fontSize: 64, opacity: 0.2 }} />
              <Typography variant="h6" fontWeight={600}>Visualizador de datos</Typography>
              <Typography variant="body2" textAlign="center" maxWidth={320}>
                {canWrite ? `Configure la URL usando el botón ✏ junto a "${targetPage?.name || currentPage.name}".` : 'El tablero o documento aún no está configurado.'}
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
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
  const [editTarget, setEditTarget] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [insightsOpen, setInsightsOpen] = useState(true)

  useEffect(() => {
    setLoadingPages(true)
    pagesService
      .list()
      .then((res) => setPageTree(res.data || []))
      .catch(() => setPageTree([]))
      .finally(() => setLoadingPages(false))
  }, [slug])

  const allPages = flattenPages(pageTree)
  const currentPage = allPages.find((p) => p.slug?.toLowerCase() === (slug || '').toLowerCase())
  const children = (currentPage?.children || []).filter((c) => c.visibility === 'published')
  const hasChildren = children.length > 0
  const targetPage = currentPage

  const baseUrl = targetPage?.powerbi_url || currentPage?.powerbi_url || null
  const powerbiUrl = selectedInsight?.powerbi_url || baseUrl

  useEffect(() => {
    if (!targetPage?.id) return
    setLoadingInsights(true)
    insightsService
      .list({ page_id: targetPage.id, status: 'published', limit: 10 })
      .then((res) => setInsights(res.data || []))
      .catch(() => setInsights([]))
      .finally(() => setLoadingInsights(false))
  }, [targetPage])

  const canWrite = can('pages', 'write')

  const handlePageSaved = () => {
    pagesService.list().then((res) => setPageTree(res.data || [])).catch(() => { })
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

  const pageIcon = targetPage?.page_type === 'narrative' ? <PdfIcon color="error" fontSize="small" />
    : targetPage?.page_type === 'excel' ? <TableViewIcon color="success" fontSize="small" />
      : targetPage?.page_type === 'folder' ? <FolderIcon color="primary" fontSize="small" />
        : <DashboardIcon color="primary" fontSize="small" />

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Shared Subheader for ALL page types */}
      <Box sx={{ bgcolor: 'background.paper', px: { xs: 2, md: 4 }, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, alignItems: { lg: 'center' }, justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              {pageIcon}
              <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={3} display="block">
                {currentPage.name.toUpperCase()}
              </Typography>
            </Box>
            {currentPage.description && (
              <Typography variant="body2" color="text.secondary">{currentPage.description}</Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {targetPage.page_type !== 'folder' && targetPage.page_type !== 'narrative' && (
              <Tooltip title={insightsOpen ? "Ocultar panel de insights" : "Ver panel de insights"}>
                <IconButton
                  size="small"
                  onClick={() => setInsightsOpen(!insightsOpen)}
                  sx={{
                    color: insightsOpen ? 'primary.main' : 'text.secondary',
                    bgcolor: insightsOpen ? 'primary.50' : 'transparent',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1.5
                  }}
                >
                  <LightbulbIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {canWrite && targetPage.page_type !== 'folder' && (
              <Tooltip title={targetPage.page_type === 'narrative' ? 'Los documentos se suben desde la vista' : 'Configurar URL del origen de datos'}>
                <IconButton size="small" onClick={() => { setEditTarget(currentPage); setEditOpen(true) }}
                  disabled={targetPage.page_type === 'narrative'}
                  sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>

      {/* Dynamic Content Body based on Active Page Type */}
      {targetPage.page_type === 'narrative' ? (
        <NarrativeView
          currentPage={currentPage}
          targetPage={targetPage}
          canWrite={canWrite}
          navigate={navigate}
          isSubView={true}
        />
      ) : targetPage.page_type === 'folder' ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 4 }}>
          <FolderIcon sx={{ fontSize: 84, color: 'text.disabled', opacity: 0.3, mb: 2 }} />
          <Typography variant="h5" color="text.secondary" fontWeight={600} gutterBottom>
            Carpeta de Contenidos
          </Typography>
          <Typography variant="body1" color="text.disabled" textAlign="center" maxWidth={400}>
            {!hasChildren
              ? 'Esta carpeta no tiene submenús asignados aún. Dirígete a "Estructura" para agregarle páginas.'
              : 'Selecciona uno de los submenús en el menú superior para visualizar su contenido.'}
          </Typography>
        </Box>
      ) : (
        <DashboardView
          targetPage={targetPage}
          currentPage={currentPage}
          powerbiUrl={powerbiUrl}
          insights={insights}
          loadingInsights={loadingInsights}
          selectedInsight={selectedInsight}
          setSelectedInsight={setSelectedInsight}
          canWrite={canWrite}
          navigate={navigate}
          insightsOpen={insightsOpen}
        />
      )}

      <EditUrlDialog open={editOpen} onClose={() => setEditOpen(false)} page={editTarget} onSaved={handlePageSaved} />
    </Box>
  )
}
