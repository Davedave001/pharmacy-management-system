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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import axios from 'axios';

export default function Inventory() {
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    prescription_required: false,
    description: '',
  });

  useEffect(() => {
    fetchMedicines();
  }, [search]);

  const fetchMedicines = async () => {
    try {
      const params = search ? { search } : {};
      const response = await axios.get('/api/medicines', { params });
      setMedicines(response.data.medicines);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const fetchBatches = async (medicineId) => {
    try {
      const response = await axios.get('/api/batches', { params: { medicine_id: medicineId } });
      setBatches(response.data.batches);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const handleOpen = (medicine = null) => {
    if (medicine) {
      setEditing(medicine);
      setFormData({
        name: medicine.name,
        category: medicine.category || '',
        price: medicine.price,
        prescription_required: medicine.prescription_required,
        description: medicine.description || '',
      });
    } else {
      setEditing(null);
      setFormData({
        name: '',
        category: '',
        price: '',
        prescription_required: false,
        description: '',
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
        await axios.put(`/api/medicines/${editing.id}`, formData);
      } else {
        await axios.post('/api/medicines', formData);
      }
      handleClose();
      fetchMedicines();
    } catch (error) {
      console.error('Error saving medicine:', error);
      alert('Error saving medicine');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      try {
        await axios.delete(`/api/medicines/${id}`);
        fetchMedicines();
      } catch (error) {
        console.error('Error deleting medicine:', error);
        alert('Error deleting medicine');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Inventory Management</Typography>
        <Box>
          <TextField
            placeholder="Search medicines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mr: 2 }}
          />
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
            Add Medicine
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Prescription Required</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {medicines.map((medicine) => (
              <TableRow key={medicine.id}>
                <TableCell>{medicine.name}</TableCell>
                <TableCell>{medicine.category || '-'}</TableCell>
                <TableCell>${parseFloat(medicine.price).toFixed(2)}</TableCell>
                <TableCell>
                  {medicine.prescription_required ? (
                    <Chip label="Yes" color="warning" size="small" />
                  ) : (
                    <Chip label="No" color="success" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpen(medicine)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(medicine.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Medicine' : 'Add Medicine'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Prescription Required</InputLabel>
            <Select
              value={formData.prescription_required}
              onChange={(e) => setFormData({ ...formData, prescription_required: e.target.value })}
            >
              <MenuItem value={false}>No</MenuItem>
              <MenuItem value={true}>Yes</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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

