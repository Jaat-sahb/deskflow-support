import { DragDropContext } from '@hello-pangea/dnd';
import { useState } from 'react';
import Column from './Column';

const COLUMNS = [
  { id: 'open', title: 'Open' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'resolved', title: 'Resolved' },
  { id: 'closed', title: 'Closed' }
];

function Board({ tickets, onTicketUpdate, setTickets }) {
  const [errorToast, setErrorToast] = useState(null);

  const showError = (message) => {
    setErrorToast(message);
    setTimeout(() => setErrorToast(null), 3000);
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId) {
      return;
    }

    const ticketId = draggableId;
    const newStatus = destination.droppableId;
    
    // Store original state for reverting
    const originalTickets = [...tickets];
    
    // Optimistically update
    setTickets(prev => prev.map(t => 
      t._id === ticketId ? { ...t, status: newStatus } : t
    ));

    const res = await onTicketUpdate(ticketId, { status: newStatus });
    
    if (!res.success) {
      // Revert on failure
      setTickets(originalTickets);
      showError(res.error);
    }
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="board">
          {COLUMNS.map(col => (
            <Column 
              key={col.id} 
              column={col} 
              tickets={tickets.filter(t => t.status === col.id)} 
              onTicketUpdate={onTicketUpdate}
              showError={showError}
            />
          ))}
        </div>
      </DragDropContext>

      {errorToast && (
        <div className="toast-error">
          {errorToast}
        </div>
      )}
    </>
  );
}

export default Board;
