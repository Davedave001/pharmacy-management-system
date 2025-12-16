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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import axios from 'axios';

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    invoice_number: '',
    status: 'pending',
  });

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
    fetchMedicines();
  }, []);

  const fetchPurchases = async () => {
    try {
      const response = await axios.get('/api/purchases');
      setPurchases(response.data.purchases);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/api/suppliers');
      setSuppliers(response.data.suppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await axios.get('/api/medicines');
      setMedicines(response.data.medicines);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const addItem = () => {
    setItems([...items, {
      medicine_id: '',
      batch_number: '',
      expiry_date: '',
      quantity: 1,
      unit_price: 0,
    }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      await axios.post('/api/purchases', {
        ...formData,
        items,
      });
      setOpen(false);
      setItems([]);
      setFormData({
        supplier_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        invoice_number: '',
        status: 'pending',
      });
      fetchPurchases();
    } catch (error) {
      console.error('Error creating purchase:', error);
      alert('Error creating purchase');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'received':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Purchases</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          New Purchase
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Invoice Number</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {purchases.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell>{new Date(purchase.purchase_date).toLocaleDateString()}</TableCell>
                <TableCell>{purchase.supplier_name || '-'}</TableCell>
                <TableCell>{purchase.invoice_number || '-'}</TableCell>
                <TableCell>${parseFloat(purchase.total_amount).toFixed(2)}</TableCell>
                <TableCell>
                  <Chip label={purchase.status} color={getStatusColor(purchase.status)} size="small" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>New Purchase</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Supplier</InputLabel>
            <Select
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
            >
              {suppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Purchase Date"
            type="date"
            value={formData.purchase_date}
            onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Invoice Number"
            value={formData.invoice_number}
            onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="received">Received</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ mt: 2 }}>
            <Button onClick={addItem} variant="outlined" sx={{ mb: 2 }}>
              Add Item
            </Button>
            {items.map((item, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Medicine</InputLabel>
                  <Select
                    value={item.medicine_id}
                    onChange={(e) => updateItem(index, 'medicine_id', e.target.value)}
                  >
                    {medicines.map((medicine) => (
                      <MenuItem key={medicine.id} value={medicine.id}>
                        {medicine.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Batch Number"
                  value={item.batch_number}
                  onChange={(e) => updateItem(index, 'batch_number', e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Expiry Date"
                  type="date"
                  value={item.expiry_date}
                  onChange={(e) => updateItem(index, 'expiry_date', e.target.value)}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Unit Price"
                  type="number"
                  value={item.unit_price}
                  onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                  margin="normal"
                />
                <Button onClick={() => removeItem(index)} color="error">
                  Remove
                </Button>
              </Paper>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={items.length === 0}>
            Create Purchase
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

