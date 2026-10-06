const { all, get, run } = require('../database/db');

async function getMaintenanceRecords(req, res, next) {
  try {
    const { system_id, status } = req.query;
    let sql = `
      SELECT m.*, s.system_name, s.model, s.location, c.component_name
      FROM maintenance_records m
      LEFT JOIN energy_systems s ON m.system_id = s.id
      LEFT JOIN system_components c ON m.component_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (system_id && system_id !== 'ALL') {
      sql += ' AND m.system_id = ?';
      params.push(system_id);
    }

    if (status && status !== 'ALL') {
      sql += ' AND m.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY CASE m.status WHEN "OVERDUE" THEN 1 WHEN "IN PROGRESS" THEN 2 WHEN "SCHEDULED" THEN 3 ELSE 4 END, m.scheduled_date ASC';

    const records = await all(sql, params);
    return res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (err) {
    next(err);
  }
}

async function createMaintenanceRecord(req, res, next) {
  try {
    const {
      system_id,
      component_id,
      maintenance_type,
      status = 'SCHEDULED',
      title,
      description,
      scheduled_date,
      technician,
      notes,
      next_due_date
    } = req.body;

    if (!system_id || !maintenance_type || !title || !description || !scheduled_date || !technician) {
      return res.status(400).json({
        success: false,
        error: 'Missing required maintenance record fields (system_id, maintenance_type, title, description, scheduled_date, technician).'
      });
    }

    const system = await get('SELECT id FROM energy_systems WHERE id = ?', [system_id]);
    if (!system) {
      return res.status(404).json({ success: false, error: `System '${system_id}' does not exist.` });
    }

    const id = `MNT-${Date.now()}`;

    await run(`
      INSERT INTO maintenance_records (
        id, system_id, component_id, maintenance_type, status,
        title, description, scheduled_date, technician, notes, next_due_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, system_id, component_id || null, maintenance_type, status,
      title, description, scheduled_date, technician, notes || null, next_due_date || null
    ]);

    // Record audit event
    await run(`
      INSERT INTO events (system_id, event_type, event_source, severity, description)
      VALUES (?, 'MAINTENANCE_CREATED', 'Operations Center', 'INFO', ?)
    `, [system_id, `Work Order '${title}' scheduled for ${scheduled_date} assigned to ${technician}`]);

    const created = await get('SELECT * FROM maintenance_records WHERE id = ?', [id]);
    return res.status(201).json({
      success: true,
      message: 'Maintenance work order created successfully.',
      data: created
    });
  } catch (err) {
    next(err);
  }
}

async function updateMaintenanceRecord(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes, completed_date, next_due_date } = req.body;

    const existing = await get('SELECT * FROM maintenance_records WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: `Maintenance record '${id}' not found.` });
    }

    const newStatus = status || existing.status;
    const newNotes = notes !== undefined ? notes : existing.notes;
    const newCompleted = completed_date !== undefined ? completed_date : existing.completed_date;
    const newNextDue = next_due_date !== undefined ? next_due_date : existing.next_due_date;

    await run(`
      UPDATE maintenance_records
      SET status = ?, notes = ?, completed_date = ?, next_due_date = ?
      WHERE id = ?
    `, [newStatus, newNotes, newCompleted, newNextDue, id]);

    // If marked COMPLETED, update component maintenance date if linked
    if (newStatus === 'COMPLETED' && existing.component_id) {
      await run(`
        UPDATE system_components
        SET last_maintenance_date = date('now'), next_maintenance_date = ?
        WHERE id = ?
      `, [newNextDue || date('now', '+90 days'), existing.component_id]);
    }

    const updated = await get('SELECT * FROM maintenance_records WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: 'Maintenance record updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMaintenanceRecords,
  createMaintenanceRecord,
  updateMaintenanceRecord
};
