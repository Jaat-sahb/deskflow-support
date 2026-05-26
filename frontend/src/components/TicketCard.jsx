import { Draggable } from '@hello-pangea/dnd';
import { Clock, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';

function TicketCard({ ticket, index, onTicketUpdate, showError }) {
  const handleMove = async (newStatus) => {
    const res = await onTicketUpdate(ticket._id, { status: newStatus });
    if (!res.success) {
      showError(res.error);
    }
  };

  const formatAge = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  return (
    <Draggable draggableId={ticket._id} index={index}>
      {(provided, snapshot) => (
        <div
          className={`ticket-card glass ${ticket.slaBreached ? 'sla-breached' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.8 : 1,
            zIndex: snapshot.isDragging ? 100 : 1
          }}
        >
          <div className="card-header">
            <div className="card-subject">{ticket.subject}</div>
            <span className={`badge badge-${ticket.priority}`}>
              {ticket.priority}
            </span>
          </div>
          
          <div className="card-footer">
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={12} />
                {formatAge(ticket.ageMinutes)}
              </span>
              
              {ticket.slaBreached && (
                <span className="sla-badge">
                  <AlertTriangle size={12} /> SLA
                </span>
              )}
            </div>
            
            <div className="card-actions">
              {ticket.status === 'in_progress' && (
                <button className="action-btn" onClick={() => handleMove('open')} title="Move to Open">
                  <ArrowLeft size={14} />
                </button>
              )}
              {ticket.status === 'resolved' && (
                <button className="action-btn" onClick={() => handleMove('in_progress')} title="Move to In Progress">
                  <ArrowLeft size={14} />
                </button>
              )}
              
              {ticket.status === 'open' && (
                <button className="action-btn" onClick={() => handleMove('in_progress')} title="Move to In Progress">
                  <ArrowRight size={14} />
                </button>
              )}
              {ticket.status === 'in_progress' && (
                <button className="action-btn" onClick={() => handleMove('resolved')} title="Move to Resolved">
                  <ArrowRight size={14} />
                </button>
              )}
              {ticket.status === 'resolved' && (
                <button className="action-btn" onClick={() => handleMove('closed')} title="Move to Closed">
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default TicketCard;
