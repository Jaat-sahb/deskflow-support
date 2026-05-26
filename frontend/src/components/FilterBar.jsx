function FilterBar({ priorityFilter, setPriorityFilter, showBreachedOnly, setShowBreachedOnly }) {
  const priorities = ['all', 'low', 'medium', 'high', 'urgent'];

  return (
    <div className="filter-bar">
      <div className="filter-group">
        {priorities.map(p => (
          <button
            key={p}
            className={`filter-btn ${priorityFilter === p ? 'active' : ''}`}
            onClick={() => setPriorityFilter(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>
      
      <label className="toggle-group glass" style={{ padding: '0.4rem 1rem', borderRadius: '8px' }}>
        <input 
          type="checkbox" 
          className="toggle-input"
          checked={showBreachedOnly}
          onChange={(e) => setShowBreachedOnly(e.target.checked)}
        />
        Show SLA Breached Only
      </label>
    </div>
  );
}

export default FilterBar;
