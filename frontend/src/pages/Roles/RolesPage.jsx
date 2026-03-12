/**
 * Gestión de Roles — Admin only.
 * Lista de roles con panel lateral para editar permisos por módulo.
 */
import { useEffect, useState, useCallback } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  FormGroup,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'
import LockIcon from '@mui/icons-material/Lock'

import { rolesService } from '../../services/usersService'
import { usePermissions } from '../../hooks/usePermissions'

const ACTION_LABELS = {
  read: 'Ver',
  write: 'Crear / Editar',
  delete: 'Eliminar',
  publish: 'Publicar',
}

const MODULE_LABELS = {
  dashboard: 'Sala de Control',
  insights: 'Insights / Entradas',
  pages: 'Estructura del Portal',
  users: 'Usuarios',
  roles: 'Roles',
}

/** Group permissions by module */
function groupByModule(permissions) {
  const map = {}
  for (const p of permissions) {
    if (!map[p.module]) map[p.module] = []
    map[p.module].push(p)
  }
  return map
}

const EMPTY_FORM = { name: '', display_name: '', description: '', permission_ids: [] }

export default function RolesPage() {
  const { can } = usePermissions()
  const canWrite = can('users', 'write')

  const [roles, setRoles] = useState([])
  const [allPermissions, setAllPermissions] = useState([])
  const [loading, setLoading] = useState(true)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' })
  const notify = (msg, severity = 'success') => setSnack({ open: true, msg, severity })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [rolesRes, permsRes] = await Promise.all([
        rolesService.list(),
        rolesService.listPermissions(),
      ])
      setRoles(rolesRes.data)
      setAllPermissions(permsRes.data)
    } catch {
      notify('Error al cargar datos', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Build permission_ids from current role for editing
  const getRolePermIds = useCallback(
    async (role) => {
      // We'll derive this from what the backend returns for the role
      // Since RoleResponse doesn't include permission_ids, we cross-reference
      // allPermissions vs what's set. Instead, fetch full role detail.
      // For now re-use allPermissions and we just start with empty and let user set them.
      return []
    },
    [],
  )

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDrawerOpen(true)
  }

  const openEdit = (role) => {
    setEditing(role)
    // We don't have permission_ids on RoleResponse — start clean, user adjusts.
    // This is a known limitation; a future enhancement is GET /roles/{id} returning perm_ids.
    setForm({
      name: role.name,
      display_name: role.display_name,
      description: role.description || '',
      permission_ids: [],
    })
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setEditing(null)
  }

  const togglePerm = (permId) => {
    setForm((f) => {
      const ids = f.permission_ids.includes(permId)
        ? f.permission_ids.filter((id) => id !== permId)
        : [...f.permission_ids, permId]
      return { ...f, permission_ids: ids }
    })
  }

  const toggleModule = (modulePerms) => {
    const ids = modulePerms.map((p) => p.id)
    const allSelected = ids.every((id) => form.permission_ids.includes(id))
    setForm((f) => {
      if (allSelected) {
        return { ...f, permission_ids: f.permission_ids.filter((id) => !ids.includes(id)) }
      }
      const merged = [...new Set([...f.permission_ids, ...ids])]
      return { ...f, permission_ids: merged }
    })
  }

  const handleSave = async () => {
    if (!form.display_name) {
      notify('El nombre del rol es obligatorio', 'warning')
      return
    }
    if (!editing && !form.name) {
      notify('El identificador del rol es obligatorio', 'warning')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await rolesService.update(editing.id, {
          display_name: form.display_name,
          description: form.description,
          permission_ids: form.permission_ids,
        })
        notify('Rol actualizado')
      } else {
        await rolesService.create({
          name: form.name,
          display_name: form.display_name,
          description: form.description,
          permission_ids: form.permission_ids,
        })
        notify('Rol creado')
      }
      closeDrawer()
      loadData()
    } catch (err) {
      notify(err?.response?.data?.detail || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (role) => {
    try {
      await rolesService.delete(role.id)
      notify('Rol eliminado')
      setConfirmDelete(null)
      loadData()
    } catch (err) {
      notify(err?.response?.data?.detail || 'Error al eliminar', 'error')
    }
  }

  const grouped = groupByModule(allPermissions)

  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <AdminPanelSettingsIcon color="primary" />
        <Typography variant="h4" fontWeight={800}>
          Gestión de Roles
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Define los roles del sistema y asigna permisos granulares por módulo.
      </Typography>

      {/* Toolbar */}
      <Box sx={{ display: 'flex', mb: 2, justifyContent: 'flex-end' }}>
        {canWrite && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Nuevo rol
          </Button>
        )}
      </Box>

      {/* Roles table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider' }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Nombre del rol</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Identificador</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Descripción</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                {canWrite && <TableCell align="right" sx={{ fontWeight: 700 }}>Acciones</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((role) => (
                <TableRow
                  key={role.id}
                  hover
                  sx={{ cursor: canWrite ? 'pointer' : 'default' }}
                  onClick={() => canWrite && openEdit(role)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {role.display_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                      {role.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {role.description || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {role.is_system ? (
                      <Chip
                        icon={<LockIcon sx={{ fontSize: 12 }} />}
                        label="Sistema"
                        size="small"
                        color="default"
                        sx={{ fontSize: 11 }}
                      />
                    ) : (
                      <Chip label="Personalizado" size="small" color="primary" variant="outlined" sx={{ fontSize: 11 }} />
                    )}
                  </TableCell>
                  {canWrite && (
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Editar permisos">
                        <IconButton size="small" onClick={() => openEdit(role)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {!role.is_system && (
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setConfirmDelete(role)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Edit / Create Dialog */}
      <Dialog
        open={drawerOpen}
        onClose={closeDrawer}
        fullWidth
        maxWidth="sm"
        scroll="paper"
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>
            {editing ? `Editar: ${editing.display_name}` : 'Nuevo rol'}
          </Typography>
          <IconButton onClick={closeDrawer} sx={{ ml: 1, color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Nombre visible *"
              fullWidth
              size="small"
              value={form.display_name}
              onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              disabled={editing?.is_system}
            />
            {!editing && (
              <TextField
                label="Identificador (slug) *"
                fullWidth
                size="small"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))
                }
                helperText="Ej: gerente_ventas — sin espacios, solo letras, números y guión bajo"
              />
            )}
            <TextField
              label="Descripción"
              fullWidth
              size="small"
              multiline
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />

            <Divider />

            <Typography variant="subtitle2" fontWeight={700}>
              Permisos por módulo
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {form.permission_ids.length} permisos seleccionados
              {editing?.is_system && ' — Los roles del sistema no deben modificarse.'}
            </Typography>

            {Object.entries(grouped).map(([module, perms]) => {
              const allSelected = perms.every((p) => form.permission_ids.includes(p.id))
              const someSelected = perms.some((p) => form.permission_ids.includes(p.id))
              return (
                <Paper
                  key={module}
                  elevation={0}
                  sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}
                >
                  {/* Module header */}
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      bgcolor: 'action.hover',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={allSelected}
                          indeterminate={someSelected && !allSelected}
                          onChange={() => toggleModule(perms)}
                          disabled={editing?.is_system}
                        />
                      }
                      label={
                        <Typography variant="subtitle2" fontWeight={700}>
                          {MODULE_LABELS[module] || module}
                        </Typography>
                      }
                    />
                  </Box>

                  {/* Permission checkboxes */}
                  <FormGroup sx={{ px: 2, py: 1 }}>
                    {perms.map((perm) => (
                      <FormControlLabel
                        key={perm.id}
                        control={
                          <Checkbox
                            size="small"
                            checked={form.permission_ids.includes(perm.id)}
                            onChange={() => togglePerm(perm.id)}
                            disabled={editing?.is_system}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2">
                              {ACTION_LABELS[perm.action] || perm.action}
                            </Typography>
                            {perm.description && (
                              <Typography variant="caption" color="text.secondary">
                                {perm.description}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    ))}
                  </FormGroup>
                </Paper>
              )
            })}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, bgcolor: 'background.default' }}>
          <Button variant="outlined" onClick={closeDrawer} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || editing?.is_system}
          >
            {saving ? <CircularProgress size={18} /> : editing ? 'Guardar cambios' : 'Crear rol'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      {confirmDelete && (
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
          <Typography variant="subtitle1" fontWeight={700} mb={1}>Eliminar rol</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Se eliminará el rol <strong>{confirmDelete.display_name}</strong>. Los usuarios con este
            rol quedarán sin acceso. Esta acción no se puede deshacer.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
            <Button variant="outlined" size="small" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button variant="contained" color="error" size="small" onClick={() => handleDelete(confirmDelete)}>
              Eliminar
            </Button>
          </Box>
        </Paper>
      )
      }

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
    </Box >
  )
}
