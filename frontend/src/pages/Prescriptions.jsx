import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import axios from 'axios';

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    patient_name: '',
    doctor_name: '',
    prescription_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await axios.get('/api/prescriptions');
      setPrescriptions(response.data.prescriptions);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    }
  };

  const handleOpen = (prescription = null) => {
    if (prescription) {
      setEditing(prescription);
      setFormData({
        patient_name: prescription.patient_name,
        doctor_name: prescription.doctor_name || '',
        prescription_date: prescription.prescription_date || new Date().toISOString().split('T')[0],
        notes: prescription.notes || '',
      });
    } else {
      setEditing(null);
      setFormData({
        patient_name: '',
        doctor_name: '',
        prescription_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
  };

  const handleSubmit = async () => {
    try {
      if (editing) {
        await axios.put(`/api/prescriptions/${editing.id}`, formData);
      } else {
        await axios.post('/api/prescriptions', formData);
      }
      handleClose();
      fetchPrescriptions();
    } catch (error) {
      console.error('Error saving prescription:', error);
      alert('Error saving prescription');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this prescription?')) {
      try {
        await axios.delete(`/api/prescriptions/${id}`);
        fetchPrescriptions();
      } catch (error) {
        console.error('Error deleting prescription:', error);
        alert('Error deleting prescription');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'fulfilled':
        return 'success';
      case 'expired':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'warning';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Prescriptions</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Add Prescription
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient Name</TableCell>
              <TableCell>Doctor Name</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prescriptions.map((prescription) => (
              <TableRow key={prescription.id}>
                <TableCell>{prescription.patient_name}</TableCell>
                <TableCell>{prescription.doctor_name || '-'}</TableCell>
                <TableCell>
                  {prescription.prescription_date
                    ? new Date(prescription.prescription_date).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={prescription.status}
                    color={getStatusColor(prescription.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpen(prescription)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(prescription.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Prescription' : 'Add Prescription'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Patient Name"
            value={formData.patient_name}
            onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Doctor Name"
            value={formData.doctor_name}
            onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Prescription Date"
            type="date"
            value={formData.prescription_date}
            onChange={(e) => setFormData({ ...formData, prescription_date: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editing ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

