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
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add, Receipt } from '@mui/icons-material';
import axios from 'axios';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [formData, setFormData] = useState({
    payment_method: 'cash',
    discount_amount: 0,
    tax_rate: 0,
    notes: '',
  });

  useEffect(() => {
    fetchSales();
    fetchMedicines();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await axios.get('/api/sales');
      setSales(response.data.sales);
    } catch (error) {
      console.error('Error fetching sales:', error);
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

  const fetchBatches = async (medicineId) => {
    try {
      const response = await axios.get('/api/batches', { params: { medicine_id: medicineId } });
      setBatches(response.data.batches.filter(b => b.quantity > 0 && new Date(b.expiry_date) > new Date()));
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const addToCart = (medicine) => {
    fetchBatches(medicine.id);
    const existingItem = cart.find(item => item.medicine_id === medicine.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.medicine_id === medicine.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        medicine_id: medicine.id,
        medicine_name: medicine.name,
        batch_id: null,
        quantity: 1,
        unit_price: parseFloat(medicine.price),
      }]);
    }
  };

  const removeFromCart = (medicineId) => {
    setCart(cart.filter(item => item.medicine_id !== medicineId));
  };

  const updateCartItem = (medicineId, field, value) => {
    setCart(cart.map(item =>
      item.medicine_id === medicineId
        ? { ...item, [field]: value }
        : item
    ));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const tax = subtotal * (formData.tax_rate / 100);
    return {
      subtotal,
      tax,
      discount: parseFloat(formData.discount_amount) || 0,
      total: subtotal + tax - (parseFloat(formData.discount_amount) || 0),
    };
  };

  const handleSubmit = async () => {
    try {
      const totals = calculateTotal();
      await axios.post('/api/sales', {
        items: cart,
        ...formData,
        tax_rate: formData.tax_rate,
        total_amount: totals.total,
        tax_amount: totals.tax,
      });
      setOpen(false);
      setCart([]);
      setFormData({ payment_method: 'cash', discount_amount: 0, tax_rate: 0, notes: '' });
      fetchSales();
    } catch (error) {
      console.error('Error creating sale:', error);
      alert('Error creating sale');
    }
  };

  const totals = calculateTotal();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Sales</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          New Sale
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell>Sold By</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>{new Date(sale.sale_date).toLocaleString()}</TableCell>
                <TableCell>${parseFloat(sale.total_amount).toFixed(2)}</TableCell>
                <TableCell>
                  <Chip label={sale.payment_method} size="small" />
                </TableCell>
                <TableCell>{sale.sold_by_name}</TableCell>
                <TableCell>
                  <Button size="small" startIcon={<Receipt />}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>New Sale</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <Typography variant="h6" gutterBottom>Available Medicines</Typography>
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {medicines.map((medicine) => (
                  <Paper key={medicine.id} sx={{ p: 2, mb: 1, cursor: 'pointer' }} onClick={() => addToCart(medicine)}>
                    <Typography variant="body1">{medicine.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      ${parseFloat(medicine.price).toFixed(2)}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="h6" gutterBottom>Cart</Typography>
              {cart.map((item) => (
                <Paper key={item.medicine_id} sx={{ p: 2, mb: 1 }}>
                  <Typography variant="body2">{item.medicine_name}</Typography>
                  <TextField
                    type="number"
                    size="small"
                    label="Qty"
                    value={item.quantity}
                    onChange={(e) => updateCartItem(item.medicine_id, 'quantity', parseInt(e.target.value))}
                    sx={{ width: 80, mt: 1 }}
                  />
                  <Button size="small" onClick={() => removeFromCart(item.medicine_id)}>Remove</Button>
                </Paper>
              ))}
              <Box sx={{ mt: 2 }}>
                <Typography>Subtotal: ${totals.subtotal.toFixed(2)}</Typography>
                <Typography>Tax: ${totals.tax.toFixed(2)}</Typography>
                <Typography>Discount: ${totals.discount.toFixed(2)}</Typography>
                <Typography variant="h6">Total: ${totals.total.toFixed(2)}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="card">Card</MenuItem>
                  <MenuItem value="mobile_money">Mobile Money</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                type="number"
                label="Discount Amount"
                value={formData.discount_amount}
                onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                type="number"
                label="Tax Rate (%)"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                margin="normal"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={cart.length === 0}>
            Complete Sale
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

