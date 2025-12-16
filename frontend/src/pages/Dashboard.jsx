import { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
} from '@mui/material';
import {
  TrendingUp,
  Inventory,
  Warning,
  Assignment,
} from '@mui/icons-material';
import axios from 'axios';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/reports/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  const statCards = [
    {
      title: "Today's Sales",
      value: `$${parseFloat(stats?.todaySales?.total || 0).toFixed(2)}`,
      count: stats?.todaySales?.count || 0,
      icon: <TrendingUp color="primary" />,
      color: '#1976d2',
    },
    {
      title: "This Month's Sales",
      value: `$${parseFloat(stats?.monthSales?.total || 0).toFixed(2)}`,
      count: stats?.monthSales?.count || 0,
      icon: <TrendingUp color="success" />,
      color: '#2e7d32',
    },
    {
      title: 'Low Stock Items',
      value: stats?.lowStockCount || 0,
      icon: <Warning color="warning" />,
      color: '#ed6c02',
    },
    {
      title: 'Expiring Soon',
      value: stats?.expiringCount || 0,
      icon: <Inventory color="error" />,
      color: '#d32f2f',
    },
    {
      title: 'Pending Prescriptions',
      value: stats?.pendingPrescriptions || 0,
      icon: <Assignment color="info" />,
      color: '#0288d1',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ mr: 2 }}>{card.icon}</Box>
                  <Typography variant="h6">{card.title}</Typography>
                </Box>
                <Typography variant="h4" sx={{ color: card.color }}>
                  {card.value}
                </Typography>
                {card.count !== undefined && (
                  <Typography variant="body2" color="text.secondary">
                    {card.count} transactions
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

