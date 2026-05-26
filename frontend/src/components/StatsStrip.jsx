function StatsStrip({ stats }) {
  if (!stats) return null;

  return (
    <div className="stats-strip glass">
      <div className="stats-group">
        <div className="stat-item">
          <span>Open:</span>
          <strong>{stats.byStatus.open || 0}</strong>
        </div>
        <div className="stat-item">
          <span>In Progress:</span>
          <strong>{stats.byStatus.in_progress || 0}</strong>
        </div>
        <div className="stat-item">
          <span>Resolved:</span>
          <strong>{stats.byStatus.resolved || 0}</strong>
        </div>
        <div className="stat-item">
          <span>Closed:</span>
          <strong>{stats.byStatus.closed || 0}</strong>
        </div>
      </div>
      <div className="stat-item">
        <span className="stat-breached">🔴 SLA Breached:</span>
        <strong className="stat-breached">{stats.slaBreachedOpen || 0}</strong>
      </div>
    </div>
  );
}

export default StatsStrip;
