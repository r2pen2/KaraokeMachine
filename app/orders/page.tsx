'use client';

import React, { useMemo } from 'react';
import { Button, Divider, Grid, Group, Paper, Stack, Text, Title } from '@mantine/core';
import OrderModal from '../../components/Orders/OrderModal';
import OrdersTable from '../../components/Orders/OrdersTable';
import { useOrders } from '../../context/OrdersContext';
import type { Order } from '../../lib/db/models/order';

export default function OrdersPage() {
  const [open, setOpen] = React.useState(false);
  const [editingOrder, setEditingOrder] = React.useState<Order | undefined>(undefined);
  const { orders } = useOrders();

  function handleEdit(order: Order) {
    setEditingOrder(order);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setEditingOrder(undefined);
  }

  const allStats = useMemo(() => {
    const activeOrders = orders.filter(o => !o.hidden);
    return {
      count: activeOrders.length,
      revenue: activeOrders.reduce((sum, o) => sum + o.revenue, 0),
      expenses: activeOrders.reduce((sum, o) => sum + o.expenses, 0),
      profit: activeOrders.reduce((sum, o) => sum + o.profit, 0),
    };
  }, [orders]);

  const realizedStats = useMemo(() => {
    const doneOrders = orders.filter(o => !o.hidden && o.status === 'Done');
    return {
      count: doneOrders.length,
      revenue: doneOrders.reduce((sum, o) => sum + o.revenue, 0),
      expenses: doneOrders.reduce((sum, o) => sum + o.expenses, 0),
      profit: doneOrders.reduce((sum, o) => sum + o.profit, 0),
    };
  }, [orders]);

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Orders</Title>
        <Button onClick={() => setOpen(true)}>New order</Button>
      </Group>

      <Grid>
        <Grid.Col span={6}>
          <Paper withBorder p="md">
            <Stack gap="xs">
              <Text fw={600} size="lg">All Orders</Text>
              <Divider />
              <Group justify="space-between">
                <Text c="dimmed">Total Orders:</Text>
                <Text fw={500}>{allStats.count}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">Total Revenue:</Text>
                <Text fw={500} c="green">${allStats.revenue.toFixed(2)}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">Total Expenses:</Text>
                <Text fw={500} c="red">${allStats.expenses.toFixed(2)}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">Total Profit:</Text>
                <Text fw={700} size="lg" c={allStats.profit >= 0 ? 'teal' : 'red'}>${allStats.profit.toFixed(2)}</Text>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={6}>
          <Paper withBorder p="md">
            <Stack gap="xs">
              <Text fw={600} size="lg">Realized (Done)</Text>
              <Divider />
              <Group justify="space-between">
                <Text c="dimmed">Done Orders:</Text>
                <Text fw={500}>{realizedStats.count}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">Realized Revenue:</Text>
                <Text fw={500} c="green">${realizedStats.revenue.toFixed(2)}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">Realized Expenses:</Text>
                <Text fw={500} c="red">${realizedStats.expenses.toFixed(2)}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed">Realized Profit:</Text>
                <Text fw={700} size="lg" c={realizedStats.profit >= 0 ? 'teal' : 'red'}>${realizedStats.profit.toFixed(2)}</Text>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      <OrdersTable onEdit={handleEdit} />
      <OrderModal opened={open} onClose={handleClose} order={editingOrder} />
    </Stack>
  );
}


