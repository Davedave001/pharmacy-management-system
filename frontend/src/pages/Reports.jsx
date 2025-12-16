import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
} from '@mui/material';
import axios from 'axios';

export default function Reports() {
  const [reportType, setReportType] = useState('sales');
  const [salesReport, setSalesReport] = useState([]);
  const [inventoryReport, setInventoryReport] = useState([]);
  const [expiryReport, setExpiryReport] = useState([]);
  const [groupBy, setGroupBy] = useState('day');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (reportType === 'inventory') {
      fetchInventoryReport();
    } else if (reportType === 'expiry') {
      fetchExpiryReport();
    }
  }, [reportType]);

  const fetchSalesReport = async () => {
    try {
      const params = { group_by: groupBy };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const response = await axios.get('/api/reports/sales', { params });
      setSalesReport(response.data.report);
    } catch (error) {
      console.error('Error fetching sales report:', error);
    }
  };

  const fetchInventoryReport = async () => {
    try {
      const response = await axios.get('/api/reports/inventory');
      setInventoryReport(response.data.inventory);
    } catch (error) {
      console.error('Error fetching inventory report:', error);
    }
  };

  const fetchExpiryReport = async () => {
    try {
      const response = await axios.get('/api/reports/expiry', { params: { days: 90 } });
      setExpiryReport(response.data.batches);
    } catch (error) {
      console.error('Error fetching expiry report:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reports & Analytics
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Report Type</InputLabel>
            <Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <MenuItem value="sales">Sales Report</MenuItem>
              <MenuItem value="inventory">Inventory Report</MenuItem>
              <MenuItem value="expiry">Expiry Report</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {reportType === 'sales' && (
          <>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Group By</InputLabel>
                <Select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                  <MenuItem value="day">Day</MenuItem>
                  <MenuItem value="week">Week</MenuItem>
                  <MenuItem value="month">Month</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button variant="contained" onClick={fetchSalesReport} fullWidth>
                Generate
              </Button>
            </Grid>
          </>
        )}
      </Grid>

      <Box sx={{ mt: 3 }}>
        {reportType === 'sales' && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  <TableCell>Total Sales</TableCell>
                  <TableCell>Total Revenue</TableCell>
                  <TableCell>Tax</TableCell>
                  <TableCell>Discount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salesReport.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.period}</TableCell>
                    <TableCell>{row.total_sales}</TableCell>
                    <TableCell>${parseFloat(row.total_revenue || 0).toFixed(2)}</TableCell>
                    <TableCell>${parseFloat(row.total_tax || 0).toFixed(2)}</TableCell>
                    <TableCell>${parseFloat(row.total_discount || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {reportType === 'inventory' && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Medicine</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Total Stock</TableCell>
                  <TableCell>Batches</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventoryReport.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category || '-'}</TableCell>
                    <TableCell>${parseFloat(item.price).toFixed(2)}</TableCell>
                    <TableCell>{item.total_stock}</TableCell>
                    <TableCell>{item.batch_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {reportType === 'expiry' && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Medicine</TableCell>
                  <TableCell>Batch Number</TableCell>
                  <TableCell>Expiry Date</TableCell>
                  <TableCell>Quantity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expiryReport.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>{batch.medicine_name}</TableCell>
                    <TableCell>{batch.batch_number}</TableCell>
                    <TableCell>{new Date(batch.expiry_date).toLocaleDateString()}</TableCell>
                    <TableCell>{batch.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
}

