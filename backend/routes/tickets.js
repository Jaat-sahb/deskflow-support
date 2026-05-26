const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');

const SLA_TARGETS = {
  urgent: 60,
  high: 240,
  medium: 1440,
  low: 4320
};

const STATUS_ORDER = ['open', 'in_progress', 'resolved', 'closed'];

// Helper to compute derived fields
const computeDerivedFields = (ticket) => {
  const doc = ticket.toObject ? ticket.toObject() : ticket;
  const now = new Date();
  
  let endDate = now;
  if (doc.status === 'resolved' || doc.status === 'closed') {
    endDate = doc.resolvedAt || now;
  }
  
  const ageMinutes = Math.floor((endDate - doc.createdAt) / (1000 * 60));
  
  const target = SLA_TARGETS[doc.priority];
  let slaBreached = false;
  
  if (doc.status !== 'resolved' && doc.status !== 'closed') {
    if (ageMinutes > target) {
      slaBreached = true;
    }
  } else {
    const resolvedAgeMinutes = doc.resolvedAt 
      ? Math.floor((doc.resolvedAt - doc.createdAt) / (1000 * 60))
      : ageMinutes;
    if (resolvedAgeMinutes > target) {
      slaBreached = true;
    }
  }
  
  return {
    ...doc,
    ageMinutes,
    slaBreached
  };
};

// Error formatter
const formatMongooseErrors = (err) => {
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => el.message);
    return { message: 'Validation Error', errors };
  }
  return { message: err.message };
};

// GET /tickets/stats
router.get('/stats', async (req, res) => {
  try {
    const tickets = await Ticket.find();
    
    const stats = {
      byStatus: { open: 0, in_progress: 0, resolved: 0, closed: 0 },
      byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
      slaBreachedOpen: 0
    };
    
    tickets.forEach(t => {
      const ticketWithDerived = computeDerivedFields(t);
      
      if (stats.byStatus[t.status] !== undefined) {
        stats.byStatus[t.status]++;
      }
      
      if (stats.byPriority[t.priority] !== undefined) {
        stats.byPriority[t.priority]++;
      }
      
      if (ticketWithDerived.slaBreached && t.status !== 'resolved' && t.status !== 'closed') {
        stats.slaBreachedOpen++;
      }
    });
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /tickets
router.get('/', async (req, res) => {
  try {
    const { status, priority, breached } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    
    const tickets = await Ticket.find(query).sort({ createdAt: -1 });
    let enrichedTickets = tickets.map(t => computeDerivedFields(t));
    
    if (breached === 'true') {
      enrichedTickets = enrichedTickets.filter(t => t.slaBreached === true);
    }
    
    res.json(enrichedTickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /tickets
router.post('/', async (req, res) => {
  try {
    const ticket = new Ticket({
      subject: req.body.subject,
      description: req.body.description,
      customerEmail: req.body.customerEmail,
      priority: req.body.priority,
      status: req.body.status || 'open'
    });
    
    const newTicket = await ticket.save();
    res.status(201).json(computeDerivedFields(newTicket));
  } catch (err) {
    res.status(400).json(formatMongooseErrors(err));
  }
});

// PATCH /tickets/:id
router.patch('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    
    const newStatus = req.body.status;
    
    if (newStatus && newStatus !== ticket.status) {
      const currentIndex = STATUS_ORDER.indexOf(ticket.status);
      const newIndex = STATUS_ORDER.indexOf(newStatus);
      
      if (newIndex === -1) {
        return res.status(400).json({ message: `Invalid status: ${newStatus}` });
      }
      
      // Check transition rules
      const isForwardOne = newIndex === currentIndex + 1;
      const isBackwardOne = newIndex === currentIndex - 1;
      
      if (!isForwardOne && !isBackwardOne) {
        return res.status(400).json({ 
          message: `Invalid transition: ${ticket.status} → ${newStatus}. Allowed forward: open → in_progress → resolved → closed (no skipping). Allowed backward: one step only.` 
        });
      }
      
      // Handle resolvedAt
      if (newStatus === 'resolved') {
        ticket.resolvedAt = new Date();
      } else if (ticket.status === 'resolved') {
        ticket.resolvedAt = undefined;
      }
      
      ticket.status = newStatus;
    }
    
    // Update other fields if provided
    if (req.body.subject) ticket.subject = req.body.subject;
    if (req.body.description) ticket.description = req.body.description;
    if (req.body.priority) ticket.priority = req.body.priority;
    
    const updatedTicket = await ticket.save();
    res.json(computeDerivedFields(updatedTicket));
  } catch (err) {
    res.status(400).json(formatMongooseErrors(err));
  }
});

// DELETE /tickets/:id
router.delete('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    
    await ticket.deleteOne();
    res.json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
