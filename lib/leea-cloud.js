// LEEA Supabase sync helper.
// This file is intentionally optional: if leea-cloud-config.js is missing or
// still has placeholder values, the app keeps using localStorage only.
(function () {
  const cfg = window.LEEA_SUPABASE_CONFIG || {};
  const enabled = !!(
    window.supabase &&
    cfg.url &&
    cfg.anonKey &&
    !cfg.url.includes('YOUR-PROJECT') &&
    !cfg.anonKey.includes('YOUR-SUPABASE')
  );

  const api = {
    enabled,
    familyId: cfg.familyId || 'neritan-leo',
    client: null,
    async fetchHomework() { return null; },
    async upsertHomework() { return false; },
    async completeHomework() { return false; },
    async deleteHomework() { return false; },
    async saveProgress() { return false; },
    async fetchProgress() { return null; }
  };

  if (!enabled) {
    window.LEEA_CLOUD = api;
    return;
  }

  api.client = window.supabase.createClient(cfg.url, cfg.anonKey);

  function toLocal(row) {
    return {
      id: row.homework_id,
      lesson: row.lesson,
      unit: row.unit,
      url: row.url,
      due: row.due_date,
      assigned: row.assigned_date,
      completed: row.completed_date || undefined,
      status: row.status
    };
  }

  function toRow(entry, status) {
    return {
      family_id: api.familyId,
      homework_id: entry.id,
      lesson: entry.lesson,
      unit: entry.unit,
      url: entry.url,
      due_date: entry.due,
      assigned_date: entry.assigned || new Date().toISOString().split('T')[0],
      completed_date: status === 'completed'
        ? (entry.completed || new Date().toISOString().split('T')[0])
        : null,
      status
    };
  }

  async function run(label, task) {
    try {
      const { data, error } = await task();
      if (error) throw error;
      return data ?? true;
    } catch (error) {
      console.warn('[LEEA cloud] ' + label + ' failed:', error);
      return null;
    }
  }

  api.fetchHomework = async function () {
    const data = await run('fetchHomework', () => api.client
      .from('leea_homework')
      .select('*')
      .eq('family_id', api.familyId)
      .in('status', ['assigned', 'completed'])
      .order('assigned_date', { ascending: false }));
    return Array.isArray(data) ? data.map(toLocal) : null;
  };

  api.upsertHomework = async function (entry) {
    const data = await run('upsertHomework', () => api.client
      .from('leea_homework')
      .upsert(toRow(entry, 'assigned'), { onConflict: 'family_id,homework_id' }));
    return data !== null;
  };

  api.completeHomework = async function (entry) {
    const data = await run('completeHomework', () => api.client
      .from('leea_homework')
      .upsert(toRow(entry, 'completed'), { onConflict: 'family_id,homework_id' }));
    return data !== null;
  };

  api.deleteHomework = async function (id) {
    const data = await run('deleteHomework', () => api.client
      .from('leea_homework')
      .delete()
      .eq('family_id', api.familyId)
      .eq('homework_id', id));
    return data !== null;
  };

  api.saveProgress = async function (homeworkId, storageKey, value) {
    const data = await run('saveProgress', () => api.client
      .from('leea_progress')
      .upsert({
        family_id: api.familyId,
        homework_id: homeworkId,
        storage_key: storageKey,
        value
      }, { onConflict: 'family_id,homework_id,storage_key' }));
    return data !== null;
  };

  api.fetchProgress = async function (homeworkId) {
    const data = await run('fetchProgress', () => api.client
      .from('leea_progress')
      .select('storage_key,value')
      .eq('family_id', api.familyId)
      .eq('homework_id', homeworkId));
    return Array.isArray(data) ? data : null;
  };

  window.LEEA_CLOUD = api;
})();
