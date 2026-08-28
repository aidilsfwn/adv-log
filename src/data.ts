import { supabase } from './lib/supabase'
import type { MaintenanceItem, MaintenanceRecord, Motorcycle } from './domain'

export async function loadCloudData(userId: string) {
  if (!supabase) throw new Error('Supabase environment variables are missing.')
  const initial = await supabase.from('motorcycles').select('*').eq('user_id', userId).maybeSingle()
  let motorcycle = initial.data
  if (initial.error) throw initial.error
  if (!motorcycle) {
    const created = await supabase.from('motorcycles').insert({ user_id: userId, name: 'ADV 150', make: 'Honda', model: 'ADV150', start_date: new Date().toISOString().slice(0, 10), current_odometer_km: 0 }).select().single()
    if (created.error) throw created.error
    motorcycle = created.data
    const seeded = await supabase.rpc('seed_adv150_items', { p_motorcycle_id: motorcycle.id })
    if (seeded.error) throw seeded.error
  }
  const [itemsResult, recordsResult] = await Promise.all([
    supabase.from('maintenance_items').select('*').eq('motorcycle_id', motorcycle.id).order('sort_order'),
    supabase.from('maintenance_records').select('*').eq('motorcycle_id', motorcycle.id).order('performed_date', { ascending: false }),
  ])
  if (itemsResult.error) throw itemsResult.error
  if (recordsResult.error) throw recordsResult.error
  return {
    motorcycle: { name: motorcycle.name, make: motorcycle.make, model: motorcycle.model, startDate: motorcycle.start_date ?? '', currentOdometerKm: motorcycle.current_odometer_km, id: motorcycle.id },
    items: (itemsResult.data ?? []).map(item => ({ id: item.id, name: item.name, basis: item.basis, intervalMonths: item.interval_months ?? undefined, intervalKm: item.interval_km ?? undefined, sortOrder: item.sort_order, active: item.active })),
    records: (recordsResult.data ?? []).map(record => ({ id: record.id, itemId: record.maintenance_item_id, performedDate: record.performed_date, odometerKm: record.odometer_km, costSen: record.cost_sen ?? undefined, provider: record.provider ?? undefined, notes: record.notes ?? undefined })),
  }
}

export async function saveRecord(userId: string, motorcycleId: string, record: MaintenanceRecord) {
  if (!supabase) return
  const { error } = await supabase.from('maintenance_records').upsert({ id: record.id, user_id: userId, motorcycle_id: motorcycleId, maintenance_item_id: record.itemId, performed_date: record.performedDate, odometer_km: record.odometerKm, cost_sen: record.costSen ?? null, provider: record.provider || null, notes: record.notes || null })
  if (error) throw error
}
export async function deleteRecord(id: string) { if (supabase) { const { error } = await supabase.from('maintenance_records').delete().eq('id', id); if (error) throw error } }
export async function saveMotorcycle(userId: string, motorcycleId: string, bike: Motorcycle) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase.from('motorcycles').update({
    name: bike.name.trim(),
    make: bike.make.trim(),
    model: bike.model.trim(),
    start_date: bike.startDate || null,
    current_odometer_km: Math.max(0, Math.round(Number(bike.currentOdometerKm) || 0)),
  }).eq('id', motorcycleId).eq('user_id', userId).select('id,name,make,model,start_date,current_odometer_km').single()
  if (error) throw error
  return { id: data.id, name: data.name, make: data.make, model: data.model, startDate: data.start_date ?? '', currentOdometerKm: Number(data.current_odometer_km) } as Motorcycle & { id: string }
}
export async function saveItem(id: string, item: MaintenanceItem) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { error } = await supabase.from('maintenance_items').update({
    name: item.name,
    basis: item.basis,
    interval_months: item.basis === 'time' ? item.intervalMonths : null,
    interval_km: item.basis === 'distance' ? item.intervalKm : null,
    active: item.active,
    sort_order: item.sortOrder,
  }).eq('id', id)
  if (error) throw error
}

export async function createItem(userId: string, motorcycleId: string, item: Omit<MaintenanceItem, 'id'>) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase.from('maintenance_items').insert({
    user_id: userId,
    motorcycle_id: motorcycleId,
    name: item.name,
    basis: item.basis,
    interval_months: item.basis === 'time' ? item.intervalMonths : null,
    interval_km: item.basis === 'distance' ? item.intervalKm : null,
    sort_order: item.sortOrder,
    active: true,
  }).select().single()
  if (error) throw error
  return { id: data.id, name: data.name, basis: data.basis, intervalMonths: data.interval_months ?? undefined, intervalKm: data.interval_km ?? undefined, sortOrder: data.sort_order, active: data.active } as MaintenanceItem
}

export async function removeItem(id: string) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { error } = await supabase.from('maintenance_items').update({ active: false }).eq('id', id)
  if (error) throw error
}
