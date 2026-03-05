/**
 * Gestión de Usuarios — Admin only.
 * Left: filterable user table. Right: slide-in form panel for create/edit.
 */
import { useEffect, useState, useCallback } from 'react'
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Alert,
  Switch,
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
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'
import PeopleIcon from '@mui/icons-material/People'
import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'

import { usersService, rolesService } from '../../services/usersService'
import { usePermissions } from '../../hooks/usePermissions'

const DRAWER_WIDTH = 420

function initials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

const EMPTY_FORM = {
  username: '',
  email: '',
  full_name: '',
  password: '',
  role_id: '',
  is_active: true,
}

export default function UsersPage() {
  const { can } = usePermissions()
  const canWrite = can('users', 'write')

  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState(null) // null = create
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' })
  const [confirmDelete, setConfirmDelete] = useState(null)

  const notify = (msg, severity = 'success') =>
    setSnack({ open: true, msg, severity })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [usersRes, rolesRes] = await Promise.all([
        usersService.list(),
        rolesService.list(),
      ])
      setUsers(usersRes.data)
      setRoles(rolesRes.data)
    } catch {
      notify('Error al cargar datos', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDrawerOpen(true)
  }

  const openEdit = (user) => {
    setEditing(user)
    setForm({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      password: '',
      role_id: user.role_id,
      is_active: user.is_active,
    })
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setEditing(null)
  }

  const handleChange = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: val }))
  }

  const handleSave = async () => {
    if (!form.username || !form.email || !form.full_name || !form.role_id) {
      notify('Complete todos los campos obligatorios', 'warning')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      if (editing) {
        await usersService.update(editing.id, payload)
        notify('Usuario actualizado')
      } else {
        if (!payload.password) {
          notify('La contraseña es obligatoria para nuevos usuarios', 'warning')
          setSaving(false)
          return
        }
        await usersService.create(payload)
        notify('Usuario creado')
      }
      closeDrawer()
      loadData()
    } catch (err) {
      notify(err?.response?.data?.detail || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user) => {
    try {
      await usersService.delete(user.id)
      notify('Usuario eliminado')
      setConfirmDelete(null)
      loadData()
    } catch (err) {
      notify(err?.response?.data?.detail || 'Error al eliminar', 'error')
    }
  }

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <PeopleIcon color="primary" />
        <Typography variant="h4" fontWeight={800}>
          Administracion de Usuarios
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Configura los accesos, roles y permisos de tu equipo corporativo.
      </Typography>

      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Buscar usuarios..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ width: 280 }}
        />
        <Box sx={{ flex: 1 }} />
        {canWrite && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
          >
            Nuevo usuario
          </Button>
        )}
      </Box>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', flex: 1 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Usuario</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Rol</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                {canWrite && <TableCell align="right" sx={{ fontWeight: 700 }}>Acciones</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.disabled' }}>
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((user) => (
                <TableRow
                  key={user.id}
                  hover
                  sx={{ cursor: canWrite ? 'pointer' : 'default' }}
                  onClick={() => canWrite && openEdit(user)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'primary.main' }}>
                        {initials(user.full_name)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {user.full_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          @{user.username}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{user.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={user.role_name} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_active ? 'Activo' : 'Inactivo'}
                      size="small"
                      color={user.is_active ? 'success' : 'default'}
                    />
                  </TableCell>
                  {canWrite && (
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => openEdit(user)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setConfirmDelete(user)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Edit / Create Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={closeDrawer}
        PaperProps={{ sx: { width: DRAWER_WIDTH, p: 0 } }}
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
            {editing ? 'Editar usuario' : 'Nuevo usuario'}
          </Typography>
          <IconButton onClick={closeDrawer}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {editing && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <Avatar sx={{ width: 64, height: 64, fontSize: 24, bgcolor: 'primary.main' }}>
                {initials(form.full_name)}
              </Avatar>
            </Box>
          )}

          <TextField
            label="Nombre completo *"
            fullWidth
            size="small"
            value={form.full_name}
            onChange={handleChange('full_name')}
          />
          <TextField
            label="Nombre de usuario *"
            fullWidth
            size="small"
            value={form.username}
            onChange={handleChange('username')}
          />
          <TextField
            label="Correo electronico *"
            fullWidth
            size="small"
            type="email"
            value={form.email}
            onChange={handleChange('email')}
          />
          <TextField
            label={editing ? 'Nueva contrasena (opcional)' : 'Contrasena *'}
            fullWidth
            size="small"
            type="password"
            value={form.password}
            onChange={handleChange('password')}
            helperText={editing ? 'Dejar en blanco para mantener la actual' : ''}
          />

          <FormControl fullWidth size="small">
            <InputLabel>Rol *</InputLabel>
            <Select
              label="Rol *"
              value={form.role_id}
              onChange={handleChange('role_id')}
            >
              {roles.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.display_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
            }
            label="Usuario activo"
          />

          <Divider />

          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={closeDrawer} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? <CircularProgress size={18} /> : editing ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Delete Confirmation */}
      {confirmDelete && (
        <Drawer
          anchor="bottom"
          open={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          PaperProps={{ sx: { borderTopLeftRadius: 12, borderTopRightRadius: 12, p: 3 } }}
        >
          <Typography variant="h6" fontWeight={700} mb={1}>
            Eliminar usuario
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Esta accion eliminara permanentemente a{' '}
            <strong>{confirmDelete.full_name}</strong>. Esta accion no se puede
            deshacer.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleDelete(confirmDelete)}
            >
              Eliminar
            </Button>
          </Box>
        </Drawer>
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
