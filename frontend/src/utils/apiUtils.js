export function getErrorMessage(err, defaultMsg = 'Ocurrió un error inesperado') {
  const detail = err?.response?.data?.detail
  if (!detail) return defaultMsg
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map(d => d.msg || JSON.stringify(d)).join(', ')
  }
  return JSON.stringify(detail)
}
