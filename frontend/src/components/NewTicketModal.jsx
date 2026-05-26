import { useState } from 'react';
import { X } from 'lucide-react';

function NewTicketModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    customerEmail: '',
    priority: 'medium'
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!formData.customerEmail) {
      newErrors.customerEmail = 'Email is required';
    } else if (!emailRegex.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError(null);
    try {
      await onSubmit(formData);
    } catch (err) {
      if (err.response?.data?.errors) {
        // Handle mongoose validation errors if any
        setApiError(err.response.data.errors.join(', '));
      } else {
        setApiError(err.response?.data?.message || 'Failed to create ticket');
      }
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Ticket</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {apiError && <div className="form-error" style={{ fontSize: '0.9rem' }}>{apiError}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <input 
              type="text" 
              name="subject" 
              className="form-control" 
              value={formData.subject}
              onChange={handleChange}
              placeholder="E.g., Cannot access dashboard"
            />
            {errors.subject && <span className="form-error">{errors.subject}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Customer Email</label>
            <input 
              type="email" 
              name="customerEmail" 
              className="form-control" 
              value={formData.customerEmail}
              onChange={handleChange}
              placeholder="customer@example.com"
            />
            {errors.customerEmail && <span className="form-error">{errors.customerEmail}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Priority</label>
            <select 
              name="priority" 
              className="form-control"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea 
              name="description" 
              className="form-control" 
              rows="4"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide details about the issue..."
            ></textarea>
            {errors.description && <span className="form-error">{errors.description}</span>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewTicketModal;
