import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Chip,
  Divider,
  Alert,
  Skeleton,
} from '@mui/material'
import {
  Upload as UploadIcon,
  PictureAsPdf as PdfIcon,
  Delete as DeleteIcon,
  OpenInNew as OpenInNewIcon,
  Edit as EditIcon,
  FilePresent as FilePresentIcon,
  Link as LinkIcon,
} from '@mui/icons-material'
import { documentsService } from '../../services/documentsService'
import { pagesService } from '../../services/pagesService'

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

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

/* ── Upload / Edit Dialog ────────────────────────────────────────────────── */
function UploadDialog({ open, onClose, onSaved, editDoc, narrativePages }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pageId, setPageId] = useState('')
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const isEdit = Boolean(editDoc)

  useEffect(() => {
    if (open) {
      setTitle(editDoc?.title || '')
      setDescription(editDoc?.description || '')
      setPageId(editDoc?.page_id || '')
      setFile(null)
      setError('')
    }
  }, [open, editDoc])

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)
  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.type === 'application/pdf' || dropped?.name?.endsWith('.pdf')) {
      setFile(dropped)
      setError('')
    } else {
      setError('Solo se aceptan archivos PDF.')
    }
  }

  const handleFileChange = (e) => {
    const picked = e.target.files[0]
    if (picked) { setFile(picked); setError('') }
  }

  const handleSave = async () => {
    if (!title.trim()) { setError('El título es obligatorio.'); return }
    if (!isEdit && !file) { setError('Selecciona un archivo PDF.'); return }

    setSaving(true)
    setError('')
    try {
      if (isEdit) {
        const data = {
          title: title.trim(),
          description: description.trim() || null,
          ...(pageId !== '' && { page_id: pageId || null }),
        }
        const res = await documentsService.update(editDoc.id, data)
        onSaved(res.data, false)
      } else {
        const fd = new FormData()
        fd.append('title', title.trim())
        fd.append('description', description.trim())
        if (pageId) fd.append('page_id', String(pageId))
        fd.append('file', file)
        const res = await documentsService.upload(fd)
        onSaved(res.data, true)
      }
      onClose()
    } catch (err) {
      const detail = err?.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail.map((d) => d.msg || d.message || JSON.stringify(d)).join(', ')
        : (typeof detail === 'string' ? detail : 'Error al guardar el documento.')
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PdfIcon color="error" />
        {isEdit ? 'Editar documento' : 'Subir documento PDF'}
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        {error && <Alert severity="error" sx={{ py: 0 }}>{error}</Alert>}

        {/* Drag & drop zone — only for new uploads */}
        {!isEdit && (
          <Box
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              border: '2px dashed',
              borderColor: dragging ? 'primary.main' : file ? 'success.main' : 'divider',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: dragging ? 'primary.50' : file ? 'success.50' : 'action.hover',
              transition: 'all 0.15s',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            {file ? (
              <>
                <FilePresentIcon sx={{ fontSize: 36, color: 'success.main', mb: 0.5 }} />
                <Typography variant="body2" fontWeight={600} color="success.main">{file.name}</Typography>
                <Typography variant="caption" color="text.secondary">{formatSize(file.size)}</Typography>
              </>
            ) : (
              <>
                <UploadIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  Arrastra un PDF aquí o <strong>haz clic para seleccionar</strong>
                </Typography>
                <Typography variant="caption" color="text.disabled">Solo archivos .pdf</Typography>
              </>
            )}
          </Box>
        )}

        <TextField
          label="Título *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          size="small"
        />

        <TextField
          label="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          size="small"
          multiline
          minRows={2}
        />

        {/* Associate with a narrative page */}
        <FormControl fullWidth size="small">
          <InputLabel>Asociar a página narrativa (opcional)</InputLabel>
          <Select
            value={pageId}
            label="Asociar a página narrativa (opcional)"
            onChange={(e) => setPageId(e.target.value)}
          >
            <MenuItem value=""><em>Sin página</em></MenuItem>
            {narrativePages.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={14} /> : <UploadIcon />}
        >
          {isEdit ? 'Guardar cambios' : 'Subir PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

/* ── Delete confirm Dialog ───────────────────────────────────────────────── */
function DeleteDialog({ open, onClose, doc, onDeleted }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      await documentsService.delete(doc.id)
      onDeleted(doc.id)
      onClose()
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Eliminar documento</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          ¿Eliminar <strong>"{doc?.title}"</strong>? El archivo PDF también se eliminará del servidor.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button variant="contained" color="error" onClick={handleDelete} disabled={loading}
          startIcon={loading ? <CircularProgress size={14} /> : <DeleteIcon />}>
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

/* ── Document card ───────────────────────────────────────────────────────── */
function DocCard({ doc, onEdit, onDelete }) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        '&:hover': { borderColor: 'primary.main', boxShadow: 2 },
        transition: 'all 0.15s',
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          width: 44, height: 44, bgcolor: 'error.50', borderRadius: 1.5,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        <PdfIcon sx={{ color: 'error.main', fontSize: 24 }} />
      </Box>

      {/* Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" fontWeight={700} noWrap>{doc.title}</Typography>
        {doc.description && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }} noWrap>
            {doc.description}
          </Typography>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
          {doc.page_name && (
            <Chip
              icon={<LinkIcon sx={{ fontSize: 12 }} />}
              label={doc.page_name}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ fontSize: 11, height: 20 }}
            />
          )}
          {doc.file_size && (
            <Chip label={formatSize(doc.file_size)} size="small" sx={{ fontSize: 11, height: 20 }} />
          )}
          <Chip label={formatDate(doc.created_at)} size="small" sx={{ fontSize: 11, height: 20 }} />
        </Box>
        {doc.original_name && (
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
            {doc.original_name}
          </Typography>
        )}
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
        <Tooltip title="Ver PDF">
          <IconButton size="small" href={doc.file_url} target="_blank" rel="noopener">
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Editar">
          <IconButton size="small" onClick={() => onEdit(doc)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar">
          <IconButton size="small" color="error" onClick={() => onDelete(doc)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  )
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function DocumentsPage() {
  const [docs, setDocs] = useState([])
  const [narrativePages, setNarrativePages] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editDoc, setEditDoc] = useState(null)
  const [deleteDoc, setDeleteDoc] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([documentsService.list(), pagesService.list()])
      .then(([docsRes, pagesRes]) => {
        setDocs(docsRes.data || [])
        // Flatten and filter for narrative pages only
        const all = flattenPages(pagesRes.data || [])
        setNarrativePages(all.filter((p) => p.page_type === 'narrative'))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleSaved = (doc, isNew) => {
    if (isNew) {
      setDocs((prev) => [doc, ...prev])
    } else {
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? doc : d)))
    }
  }

  const handleDeleted = (id) => {
    setDocs((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          px: { xs: 2, md: 4 },
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={3} display="block">
            GESTIÓN DE DOCUMENTOS
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sube y administra los PDFs asociados a las páginas narrativas del portal.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => { setEditDoc(null); setUploadOpen(true) }}
        >
          Subir PDF
        </Button>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, bgcolor: 'background.default' }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={88} />)}
          </Box>
        ) : docs.length === 0 ? (
          <Box
            sx={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 2, py: 8, color: 'text.disabled',
            }}
          >
            <PdfIcon sx={{ fontSize: 64, opacity: 0.2 }} />
            <Typography variant="h6" fontWeight={600}>Sin documentos</Typography>
            <Typography variant="body2" textAlign="center" maxWidth={320}>
              Sube tu primer PDF para asociarlo a una página narrativa del portal.
            </Typography>
            <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => setUploadOpen(true)}>
              Subir primer PDF
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: 860 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {docs.length} documento{docs.length !== 1 ? 's' : ''}
            </Typography>
            {docs.map((doc) => (
              <DocCard
                key={doc.id}
                doc={doc}
                onEdit={(d) => { setEditDoc(d); setUploadOpen(true) }}
                onDelete={setDeleteDoc}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Upload / Edit Dialog */}
      <UploadDialog
        open={uploadOpen}
        onClose={() => { setUploadOpen(false); setEditDoc(null) }}
        onSaved={handleSaved}
        editDoc={editDoc}
        narrativePages={narrativePages}
      />

      {/* Delete Dialog */}
      {deleteDoc && (
        <DeleteDialog
          open={Boolean(deleteDoc)}
          onClose={() => setDeleteDoc(null)}
          doc={deleteDoc}
          onDeleted={handleDeleted}
        />
      )}
    </Box>
  )
}
