import { Droppable } from '@hello-pangea/dnd';
import TicketCard from './TicketCard';

function Column({ column, tickets, onTicketUpdate, showError }) {
  return (
    <div className="column glass">
      <div className="column-header">
        <span>{column.title}</span>
        <span className="column-count">{tickets.length}</span>
      </div>
      
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div 
            className="cards-container"
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{ 
              background: snapshot.isDraggingOver ? 'rgba(255,255,255,0.05)' : 'transparent',
              borderRadius: '8px'
            }}
          >
            {tickets.map((ticket, index) => (
              <TicketCard 
                key={ticket._id} 
                ticket={ticket} 
                index={index} 
                onTicketUpdate={onTicketUpdate}
                showError={showError}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default Column;
