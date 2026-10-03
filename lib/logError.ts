import { getAdminDb } from './adminDb'

interface LogErrorOptions {
  route: string
  method?: string
  error: Error | any
  studentId?: string
  payload?: object
}

/**
 * Saves an API error to the api_errors table.
 * Never throws — safe to call from any catch block.
 */
export async function logApiError({ route, method, error, studentId, payload }: LogErrorOptions) {
  try {
    await getAdminDb().from('api_errors').insert({
      route,
      method:        method || 'POST',
      error_message: error?.message || String(error),
      error_stack:   error?.stack   || null,
      student_id:    studentId      || null,
      payload:       payload        || null,
    })
  } catch {
    // swallow — logging must never crash the caller
  }
}
