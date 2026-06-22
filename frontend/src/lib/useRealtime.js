import { useEffect, useRef } from 'react'
import supabase from './supabase'

export function useRealtime(table, callback, event = '*') {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const channel = supabase.channel(`realtime-${table}`)
    channel.on('postgres_changes', { event, schema: 'public', table }, payload => {
      callbackRef.current(payload)
    })
    channel.subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, event])
}

export function useRealtimeEmployee(employeeId, callback) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!employeeId) return
    const channel = supabase.channel(`employee-${employeeId}`)
    channel.on('postgres_changes', {
      event: '*', schema: 'public', table: 'employees', filter: `employee_id=eq.${employeeId}`
    }, payload => callbackRef.current(payload))
    channel.subscribe()
    return () => supabase.removeChannel(channel)
  }, [employeeId])
}

export default useRealtime
