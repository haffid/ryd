/**
 * Gestión de Estructura del Portal — Admin only.
 * Left: recursive page tree. Right: edit / create form panel.
 */
import { useEffect, useState, useCallback } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CloseIcon from '@mui/icons-material/Close'
import ArticleIcon from '@mui/icons-material/Article'
import DashboardIcon from '@mui/icons-material/Dashboard'
import LinkIcon from '@mui/icons-material/Link'
import FolderIcon from '@mui/icons-material/Folder'
import TableViewIcon from '@mui/icons-material/TableView'

import { pagesService } from '../../services/pagesService'
import { rolesService } from '../../services/usersService'
import { usePermissions } from '../../hooks/usePermissions'

const PAGE_TYPE_LABELS = {
  dashboard: 'Power BI',
  narrative: 'Documento (PDF)',
  excel: 'Excel (URL)',
  external: 'Externo',
  folder: 'Carpeta (Agrupador)',
}

const PAGE_TYPE_ICONS = {
  dashboard: <DashboardIcon fontSize="small" />,
  narrative: <ArticleIcon fontSize="small" />,
  excel: <TableViewIcon fontSize="small" />,
  external: <LinkIcon fontSize="small" />,
  folder: <FolderIcon fontSize="small" />,
}

const VISIBILITY_LABELS = {
  published: 'Publicado',
  draft: 'Borrador',
  private: 'Privado',
}

const VISIBILITY_COLORS = {
  published: 'success',
  draft: 'warning',
  private: 'default',
}

const EMPTY_FORM = {
  name: '',
  slug: '',
  icon: 'article',
  parent_id: '',
  page_type: 'dashboard',
  visibility: 'draft',
  powerbi_url: '',
  order_index: 0,
  role_ids: [],
}

/** Flatten tree to a list for parent selector */
function flattenTree(pages, depth = 0) {
  const result = []
  for (const p of pages) {
    result.push({ ...p, _depth: depth })
    if (p.children?.length) {
      result.push(...flattenTree(p.children, depth + 1))
    }
  }
  return result
}

/** Recursive tree node */
function PageTreeNode({ page, depth = 0, onSelect, selectedId, onAddChild, onDelete, canWrite }) {
  const [expanded, setExpanded] = useState(depth === 0)
  const hasChildren = page.children?.length > 0
  const isSelected = page.id === selectedId

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          pl: depth * 2.5 + 1,
          pr: 1,
          py: 0.5,
          borderRadius: 1,
          cursor: 'pointer',
          bgcolor: isSelected ? 'primary.main' : 'transparent',
          color: isSelected ? 'primary.contrastText' : 'text.primary',
          '&:hover': {
            bgcolor: isSelected ? 'primary.dark' : 'action.hover',
          },
        }}
        onClick={() => onSelect(page)}
      >
        <IconButton
          size="small"
          sx={{ p: 0.25, color: 'inherit', visibility: hasChildren ? 'visible' : 'hidden' }}
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((v) => !v)
          }}
        >
          {expanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
        </IconButton>

        <Box sx={{ color: 'inherit', display: 'flex', mr: 0.5 }}>
          {PAGE_TYPE_ICONS[page.page_type]}
        </Box>

        <Typography variant="body2" sx={{ flex: 1, fontWeight: isSelected ? 700 : 400 }}>
          {page.name}
        </Typography>

        <Chip
          label={VISIBILITY_LABELS[page.visibility]}
          size="small"
          color={isSelected ? 'default' : VISIBILITY_COLORS[page.visibility]}
          sx={{ fontSize: 10, height: 18, mr: 0.5 }}
        />

        {canWrite && (
          <Box onClick={(e) => e.stopPropagation()} sx={{ display: 'flex' }}>
            <Tooltip title="Agregar hijo">
              <IconButton
                size="small"
                sx={{ color: 'inherit', p: 0.25 }}
                onClick={() => onAddChild(page)}
              >
                <AddIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar">
              <IconButton
                size="small"
                sx={{ color: isSelected ? 'error.light' : 'error.main', p: 0.25 }}
                onClick={() => onDelete(page)}
              >
                <DeleteIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {hasChildren && (
        <Collapse in={expanded}>
          {page.children.map((child) => (
            <PageTreeNode
              key={child.id}
              page={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              onAddChild={onAddChild}
              onDelete={onDelete}
              canWrite={canWrite}
            />
          ))}
        </Collapse>
      )}
    </Box>
  )
}

export default function PagesManagerPage() {
  const { can } = usePermissions()
  const canWrite = can('pages', 'write')

  const [pages, setPages] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)

  const [selected, setSelected] = useState(null) // page being edited
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' })
  const notify = (msg, severity = 'success') => setSnack({ open: true, msg, severity })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [pagesRes, rolesRes] = await Promise.all([
        pagesService.list(),
        rolesService.list(),
      ])
      setPages(pagesRes.data)
      setRoles(rolesRes.data)
    } catch {
      notify('Error al cargar datos', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const pageToForm = (page) => ({
    name: page.name,
    slug: page.slug,
    icon: page.icon || 'article',
    parent_id: page.parent_id ?? '',
    page_type: page.page_type,
    visibility: page.visibility,
    powerbi_url: page.powerbi_url || '',
    order_index: page.order_index,
    role_ids: page.role_ids || [],
  })

  const handleSelect = (page) => {
    setIsNew(false)
    setSelected(page)
    setForm(pageToForm(page))
  }

  const handleAddRoot = () => {
    setIsNew(true)
    setSelected(null)
    setForm(EMPTY_FORM)
  }

  const handleAddChild = (parentPage) => {
    setIsNew(true)
    setSelected(null)
    setForm({ ...EMPTY_FORM, parent_id: parentPage.id })
  }

  const closeForm = () => {
    setSelected(null)
    setIsNew(false)
  }

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  const handleRoleToggle = (roleId) => {
    setForm((f) => {
      const ids = f.role_ids.includes(roleId)
        ? f.role_ids.filter((id) => id !== roleId)
        : [...f.role_ids, roleId]
      return { ...f, role_ids: ids }
    })
  }

  const buildSlug = (name) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

  const handleNameChange = (e) => {
    const name = e.target.value
    setForm((f) => ({
      ...f,
      name,
      slug: isNew ? buildSlug(name) : f.slug,
    }))
  }

  const handleSave = async () => {
    if (!form.name || !form.slug) {
      notify('Nombre y slug son obligatorios', 'warning')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        parent_id: form.parent_id === '' ? null : Number(form.parent_id),
        order_index: Number(form.order_index),
        powerbi_url: form.powerbi_url || null,
      }
      if (isNew) {
        await pagesService.create(payload)
        notify('Pagina creada')
      } else {
        await pagesService.update(selected.id, payload)
        notify('Pagina actualizada')
      }
      window.dispatchEvent(new Event('pages-updated'))
      closeForm()
      loadData()
    } catch (err) {
      notify(err?.response?.data?.detail || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await pagesService.delete(deleteTarget.id)
      notify('Pagina eliminada')
      window.dispatchEvent(new Event('pages-updated'))
      setDeleteTarget(null)
      if (selected?.id === deleteTarget.id) closeForm()
      loadData()
    } catch (err) {
      notify(err?.response?.data?.detail || 'Error al eliminar', 'error')
    }
  }

  const allPages = flattenTree(pages)
  const showForm = isNew || !!selected

  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <AccountTreeIcon color="primary" />
        <Typography variant="h4" fontWeight={800}>
          Gestion de Estructura del Portal
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Organice las paginas, menus y submenus del ecosistema corporativo.
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 3, flex: 1, minHeight: 0 }}>
          {/* Left: Tree */}
          <Paper
            elevation={0}
            sx={{
              width: showForm ? 340 : '100%',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'grey.50',
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
                Estructura
              </Typography>
              {canWrite && (
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddRoot}
                >
                  Nueva pagina
                </Button>
              )}
            </Box>

            <Box sx={{ overflowY: 'auto', flex: 1, py: 1 }}>
              {pages.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center', color: 'text.disabled' }}>
                  <Typography variant="body2">No hay paginas creadas</Typography>
                  {canWrite && (
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ mt: 2 }}
                      startIcon={<AddIcon />}
                      onClick={handleAddRoot}
                    >
                      Crear primera pagina
                    </Button>
                  )}
                </Box>
              ) : (
                pages.map((page) => (
                  <PageTreeNode
                    key={page.id}
                    page={page}
                    depth={0}
                    onSelect={handleSelect}
                    selectedId={selected?.id}
                    onAddChild={handleAddChild}
                    onDelete={setDeleteTarget}
                    canWrite={canWrite}
                  />
                ))
              )}
            </Box>
          </Paper>

          {/* Right: Form */}
          {showForm && (
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
                  py: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>
                  {isNew ? 'Nueva pagina' : `Editar: ${selected?.name}`}
                </Typography>
                <IconButton onClick={closeForm}>
                  <CloseIcon />
                </IconButton>
              </Box>

              <Box sx={{ overflowY: 'auto', flex: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  label="Nombre *"
                  fullWidth
                  size="small"
                  value={form.name}
                  onChange={handleNameChange}
                />
                <TextField
                  label="Slug (URL) *"
                  fullWidth
                  size="small"
                  value={form.slug}
                  onChange={handleChange('slug')}
                  helperText="Identificador unico en la URL"
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo de pagina</InputLabel>
                    <Select label="Tipo de pagina" value={form.page_type} onChange={handleChange('page_type')}>
                      {Object.entries(PAGE_TYPE_LABELS).map(([val, label]) => (
                        <MenuItem key={val} value={val}>{label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>Visibilidad</InputLabel>
                    <Select label="Visibilidad" value={form.visibility} onChange={handleChange('visibility')}>
                      {Object.entries(VISIBILITY_LABELS).map(([val, label]) => (
                        <MenuItem key={val} value={val}>{label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <FormControl fullWidth size="small">
                  <InputLabel>Pagina padre</InputLabel>
                  <Select label="Pagina padre" value={form.parent_id} onChange={handleChange('parent_id')}>
                    <MenuItem value="">
                      <em>Ninguna (raiz)</em>
                    </MenuItem>
                    {allPages
                      .filter((p) => !selected || p.id !== selected.id)
                      .map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {'— '.repeat(p._depth)}
                          {p.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                {(form.page_type === 'dashboard' || form.page_type === 'excel' || form.page_type === 'external') && (
                  <TextField
                    label="URL de Power BI / Excel / Externo"
                    fullWidth
                    size="small"
                    value={form.powerbi_url}
                    onChange={handleChange('powerbi_url')}
                    helperText="URL embed del reporte, excel o link externo"
                  />
                )}

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Icono (Material)"
                    size="small"
                    value={form.icon}
                    onChange={handleChange('icon')}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Orden"
                    size="small"
                    type="number"
                    value={form.order_index}
                    onChange={handleChange('order_index')}
                    sx={{ width: 100 }}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={600} mb={1}>
                    Roles con acceso
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {roles.map((role) => {
                      const active = form.role_ids.includes(role.id)
                      return (
                        <Chip
                          key={role.id}
                          label={role.display_name}
                          onClick={() => canWrite && handleRoleToggle(role.id)}
                          color={active ? 'primary' : 'default'}
                          variant={active ? 'filled' : 'outlined'}
                          sx={{ cursor: canWrite ? 'pointer' : 'default' }}
                        />
                      )
                    })}
                  </Box>
                </Box>

                <Divider />

                {canWrite && (
                  <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                    <Button variant="outlined" onClick={closeForm} disabled={saving}>
                      Cancelar
                    </Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving}>
                      {saving ? <CircularProgress size={18} /> : isNew ? 'Crear pagina' : 'Guardar cambios'}
                    </Button>
                  </Box>
                )}
              </Box>
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
            width: 400,
            zIndex: 1400,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} mb={1}>
            Eliminar pagina
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Se eliminara <strong>{deleteTarget.name}</strong> y todas sus subpaginas. Esta accion no se puede deshacer.
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
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  )
}
