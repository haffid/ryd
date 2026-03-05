/**
 * Editor de Entradas / Insights — Editor & Admin.
 * Left sidebar: list of insights with search and filter.
 * Right panel: create / edit form with rich textarea content.
 */
import { useEffect, useState, useCallback } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import EditNoteIcon from '@mui/icons-material/EditNote'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import PublishIcon from '@mui/icons-material/Publish'
import UnpublishedIcon from '@mui/icons-material/Unpublished'
import ArticleIcon from '@mui/icons-material/Article'

import { insightsService, categoriesService } from '../../services/insightsService'
import { pagesService } from '../../services/pagesService'
import { usePermissions } from '../../hooks/usePermissions'

const STATUS_LABELS = { draft: 'Borrador', published: 'Publicado' }
const STATUS_COLORS = { draft: 'warning', published: 'success' }

const EMPTY_FORM = {
  title: '',
  content: '',
  powerbi_url: '',
  category_id: '',
  page_id: '',
  status: 'draft',
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function flattenPages(pageList, depth = 0) {
  const result = []
  for (const p of pageList) {
    result.push({ ...p, _depth: depth })
    if (p.children?.length) result.push(...flattenPages(p.children, depth + 1))
  }
  return result
}

export default function InsightsPage() {
  const { can } = usePermissions()
  const canWrite = can('insights', 'write')

  const [insights, setInsights] = useState([])
  const [categories, setCategories] = useState([])
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [selected, setSelected] = useState(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' })
  const notify = (msg, severity = 'success') => setSnack({ open: true, msg, severity })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterCategory) params.category_id = filterCategory
      if (filterStatus) params.status = filterStatus
      const [insRes, catRes, pgRes] = await Promise.all([
        insightsService.list(params),
        categoriesService.list(),
        pagesService.list(),
      ])
      setInsights(insRes.data)
      setCategories(catRes.data)
      setPages(flattenPages(pgRes.data))
    } catch {
      notify('Error al cargar datos', 'error')
    } finally {
      setLoading(false)
    }
  }, [filterCategory, filterStatus])

  useEffect(() => { loadData() }, [loadData])

  const insightToForm = (ins) => ({
    title: ins.title,
    content: ins.content || '',
    powerbi_url: ins.powerbi_url || '',
    category_id: ins.category_id ?? '',
    page_id: ins.page_id ?? '',
    status: ins.status,
  })

  const handleSelect = (ins) => {
    setIsNew(false)
    setSelected(ins)
    setForm(insightToForm(ins))
  }

  const handleNew = () => {
    setIsNew(true)
    setSelected(null)
    setForm(EMPTY_FORM)
  }

  const closeForm = () => {
    setIsNew(false)
    setSelected(null)
  }

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  const handleSave = async (overrideStatus) => {
    if (!form.title) {
      notify('El titulo es obligatorio', 'warning')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        category_id: form.category_id === '' ? null : Number(form.category_id),
        page_id: form.page_id === '' ? null : Number(form.page_id),
        powerbi_url: form.powerbi_url || null,
        status: overrideStatus ?? form.status,
      }
      if (isNew) {
        const res = await insightsService.create(payload)
        notify('Entrada creada')
        setIsNew(false)
        setSelected(res.data)
        setForm(insightToForm(res.data))
      } else {
        const res = await insightsService.update(selected.id, payload)
        notify('Entrada actualizada')
        setSelected(res.data)
        setForm(insightToForm(res.data))
      }
      loadData()
    } catch (err) {
      notify(err?.response?.data?.detail || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await insightsService.delete(deleteTarget.id)
      notify('Entrada eliminada')
      setDeleteTarget(null)
      if (selected?.id === deleteTarget.id) closeForm()
      loadData()
    } catch (err) {
      notify(err?.response?.data?.detail || 'Error al eliminar', 'error')
    }
  }

  const togglePublish = () => {
    const next = form.status === 'published' ? 'draft' : 'published'
    handleSave(next)
  }

  const filtered = insights.filter((i) =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    (i.author_name || '').toLowerCase().includes(search.toLowerCase()),
  )

  const showForm = isNew || !!selected

  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <EditNoteIcon color="primary" />
        <Typography variant="h4" fontWeight={800}>
          Editor de Entradas
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Cree y publique insights estrategicos, reportes y contenido corporativo.
      </Typography>

      {loading && !showForm ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 3, flex: 1, minHeight: 0 }}>
          {/* Left Sidebar */}
          <Paper
            elevation={0}
            sx={{
              width: 300,
              flexShrink: 0,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                px: 2,
                pt: 2,
                pb: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
                  Entradas
                </Typography>
                {canWrite && (
                  <Tooltip title="Nueva entrada">
                    <IconButton size="small" onClick={handleNew}>
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <TextField
                size="small"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    label="Categoria"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <MenuItem value=""><em>Todas</em></MenuItem>
                    {categories.map((c) => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ width: 110, flexShrink: 0 }}>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    label="Estado"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value=""><em>Todos</em></MenuItem>
                    <MenuItem value="draft">Borrador</MenuItem>
                    <MenuItem value="published">Publicado</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Box sx={{ overflowY: 'auto', flex: 1 }}>
              {filtered.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', color: 'text.disabled' }}>
                  <ArticleIcon sx={{ fontSize: 40, mb: 1, opacity: 0.4 }} />
                  <Typography variant="body2">
                    {canWrite ? 'Crea tu primera entrada' : 'Sin entradas'}
                  </Typography>
                  {canWrite && (
                    <Button size="small" sx={{ mt: 1 }} onClick={handleNew} startIcon={<AddIcon />}>
                      Nueva entrada
                    </Button>
                  )}
                </Box>
              ) : (
                filtered.map((ins) => {
                  const isActive = ins.id === selected?.id
                  return (
                    <Box
                      key={ins.id}
                      onClick={() => handleSelect(ins)}
                      sx={{
                        px: 2,
                        py: 1.5,
                        cursor: 'pointer',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: isActive ? 'primary.main' : 'transparent',
                        color: isActive ? 'primary.contrastText' : 'text.primary',
                        '&:hover': {
                          bgcolor: isActive ? 'primary.dark' : 'action.hover',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            noWrap
                            sx={{ color: 'inherit' }}
                          >
                            {ins.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: isActive ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                            }}
                          >
                            {ins.author_name} · {formatDate(ins.created_at)}
                          </Typography>
                        </Box>
                        <Chip
                          label={STATUS_LABELS[ins.status]}
                          size="small"
                          color={isActive ? 'default' : STATUS_COLORS[ins.status]}
                          sx={{ fontSize: 10, height: 18 }}
                        />
                      </Box>
                    </Box>
                  )
                })
              )}
            </Box>
          </Paper>

          {/* Right: Editor */}
          {showForm ? (
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 3,
                  py: 1.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  gap: 1,
                }}
              >
                <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>
                  {isNew ? 'Nueva entrada' : form.title || 'Sin titulo'}
                </Typography>
                {!isNew && (
                  <Chip
                    label={STATUS_LABELS[form.status]}
                    color={STATUS_COLORS[form.status]}
                    size="small"
                  />
                )}
                {canWrite && !isNew && (
                  <>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={form.status === 'published' ? <UnpublishedIcon /> : <PublishIcon />}
                      onClick={togglePublish}
                      disabled={saving}
                    >
                      {form.status === 'published' ? 'Despublicar' : 'Publicar'}
                    </Button>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(selected)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
                <IconButton size="small" onClick={closeForm}>
                  <CloseIcon />
                </IconButton>
              </Box>

              <Box sx={{ overflowY: 'auto', flex: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  label="Titulo *"
                  fullWidth
                  size="small"
                  value={form.title}
                  onChange={handleChange('title')}
                  disabled={!canWrite}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Categoria</InputLabel>
                    <Select
                      label="Categoria"
                      value={form.category_id}
                      onChange={handleChange('category_id')}
                      disabled={!canWrite}
                    >
                      <MenuItem value=""><em>Sin categoria</em></MenuItem>
                      {categories.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>Pagina asociada</InputLabel>
                    <Select
                      label="Pagina asociada"
                      value={form.page_id}
                      onChange={handleChange('page_id')}
                      disabled={!canWrite}
                    >
                      <MenuItem value=""><em>Ninguna</em></MenuItem>
                      {pages.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {'— '.repeat(p._depth)}{p.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <TextField
                  label="URL de Power BI (opcional)"
                  fullWidth
                  size="small"
                  value={form.powerbi_url}
                  onChange={handleChange('powerbi_url')}
                  disabled={!canWrite}
                  helperText="Si se proporciona, se mostrara un iframe con el reporte"
                />

                <TextField
                  label="Contenido"
                  fullWidth
                  multiline
                  minRows={14}
                  value={form.content}
                  onChange={handleChange('content')}
                  disabled={!canWrite}
                  placeholder="Redacte el contenido del insight aqui."
                  sx={{
                    '& .MuiInputBase-root': {
                      fontFamily: 'inherit',
                      fontSize: 15,
                      lineHeight: 1.7,
                    },
                  }}
                />

                {form.powerbi_url && (
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600} mb={1}>
                      Vista previa Power BI
                    </Typography>
                    <Box
                      component="iframe"
                      src={form.powerbi_url}
                      sx={{
                        width: '100%',
                        height: 300,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                      title="Power BI preview"
                    />
                  </Box>
                )}

                <Divider />

                {canWrite && (
                  <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                    <Button variant="outlined" onClick={closeForm} disabled={saving}>
                      Cancelar
                    </Button>
                    <Button variant="contained" onClick={() => handleSave()} disabled={saving}>
                      {saving
                        ? <CircularProgress size={18} />
                        : isNew ? 'Crear entrada' : 'Guardar cambios'}
                    </Button>
                  </Box>
                )}
              </Box>
            </Paper>
          ) : (
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2,
                color: 'text.disabled',
              }}
            >
              <EditNoteIcon sx={{ fontSize: 56, opacity: 0.3 }} />
              <Typography variant="body1">
                Selecciona una entrada o crea una nueva
              </Typography>
              {canWrite && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleNew}>
                  Nueva entrada
                </Button>
              )}
            </Paper>
          )}
        </Box>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            p: 3,
            borderRadius: 2,
            width: 420,
            zIndex: 1400,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} mb={1}>
            Eliminar entrada
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Se eliminara permanentemente{' '}
            <strong>"{deleteTarget.title}"</strong>. Esta accion no se puede
            deshacer.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
            <Button variant="outlined" size="small" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="contained" color="error" size="small" onClick={handleDelete}>
              Eliminar
            </Button>
          </Box>
        </Paper>
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  )
}
