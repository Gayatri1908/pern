const { all, get, run } = require('../database/db');

async function getComponents(req, res, next) {
  try {
    const { system_id, component_type, status } = req.query;
    let sql = `
      SELECT c.*, s.system_name, s.model, s.location
      FROM system_components c
      JOIN energy_systems s ON c.system_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (system_id && system_id !== 'ALL') {
      sql += ' AND c.system_id = ?';
      params.push(system_id);
    }

    if (component_type && component_type !== 'ALL') {
      sql += ' AND c.component_type = ?';
      params.push(component_type);
    }

    if (status && status !== 'ALL') {
      sql += ' AND c.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY c.health_score ASC';

    const components = await all(sql, params);
    return res.json({
      success: true,
      count: components.length,
      data: components
    });
  } catch (err) {
    next(err);
  }
}

async function getComponentById(req, res, next) {
  try {
    const { id } = req.params;
    const component = await get(`
      SELECT c.*, s.system_name, s.model, s.location
      FROM system_components c
      JOIN energy_systems s ON c.system_id = s.id
      WHERE c.id = ?
    `, [id]);

    if (!component) {
      return res.status(404).json({ success: false, error: `Component '${id}' not found.` });
    }

    const maintenance = await all('SELECT * FROM maintenance_records WHERE component_id = ? ORDER BY scheduled_date DESC', [id]);

    return res.json({
      success: true,
      data: {
        ...component,
        maintenance_history: maintenance
      }
    });
  } catch (err) {
    next(err);
  }
}

async function updateComponent(req, res, next) {
  try {
    const { id } = req.params;
    const { status, health_score, operating_hours } = req.body;

    const existing = await get('SELECT * FROM system_components WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: `Component '${id}' not found.` });
    }

    const newStatus = status || existing.status;
    const newHealth = health_score !== undefined ? health_score : existing.health_score;
    const newHours = operating_hours !== undefined ? operating_hours : existing.operating_hours;

    await run(`
      UPDATE system_components
      SET status = ?, health_score = ?, operating_hours = ?
      WHERE id = ?
    `, [newStatus, newHealth, newHours, id]);

    const updated = await get('SELECT * FROM system_components WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: 'Component updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getComponents,
  getComponentById,
  updateComponent
};
