import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import api from './api';
import StatsStrip from './components/StatsStrip';
import FilterBar from './components/FilterBar';
import Board from './components/Board';
import NewTicketModal from './components/NewTicketModal';

function App() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showBreachedOnly, setShowBreachedOnly] = useState(false);
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get('/tickets/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      let url = '/tickets';
      const params = [];
      if (priorityFilter !== 'all') params.push(`priority=${priorityFilter}`);
      if (showBreachedOnly) params.push('breached=true');
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      const res = await api.get(url);
      setTickets(res.data);
    } catch (err) {
      console.error('Failed to fetch tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [priorityFilter, showBreachedOnly]);

  const handleTicketCreate = async (newTicketData) => {
    const res = await api.post('/tickets', newTicketData);
    setTickets([res.data, ...tickets]);
    fetchStats();
    setIsModalOpen(false);
  };

  const handleTicketUpdate = async (id, updates) => {
    try {
      // Optimistic UI update logic can be complex with derived fields, 
      // but for drag and drop we'll update local state immediately, then revert if error
      const res = await api.patch(`/tickets/${id}`, updates);
      
      setTickets(prev => prev.map(t => t._id === id ? res.data : t));
      fetchStats();
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Update failed', err);
      // Re-fetch to ensure sync on error
      fetchTickets();
      return { success: false, error: err.response?.data?.message || 'Update failed' };
    }
  };

  return (
    <div className="app-container">
      <StatsStrip stats={stats} />
      
      <div className="header-bar">
        <h1 className="title">DeskFlow</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          New Ticket
        </button>
      </div>
      
      <FilterBar 
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        showBreachedOnly={showBreachedOnly}
        setShowBreachedOnly={setShowBreachedOnly}
      />
      
      {loading && tickets.length === 0 ? (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      ) : (
        <Board 
          tickets={tickets} 
          onTicketUpdate={handleTicketUpdate} 
          setTickets={setTickets} 
        />
      )}
      
      {isModalOpen && (
        <NewTicketModal 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleTicketCreate} 
        />
      )}
    </div>
  );
}

export default App;
