'use client';
import { ActionIcon, Group, ScrollArea, Title } from '@mantine/core';
import FilamentsTable from '../../components/Filaments/FilamentsTable';
import { IconPlus } from '@tabler/icons-react';
import React from 'react';
import AddFilamentModal from '../../components/Filaments/AddFilamentModal';

export default function FilamentsPage() {
  const [opened, setOpened] = React.useState(false);
  return (
    <ScrollArea>
      <Group justify="space-between" mb="md">
        <Title order={2}>Filaments</Title>
        <ActionIcon variant="filled" color="blue" onClick={() => setOpened(true)} aria-label="Add filament">
          <IconPlus size={16} />
        </ActionIcon>
      </Group>
      <FilamentsTable />
      <AddFilamentModal opened={opened} onClose={() => setOpened(false)} />
    </ScrollArea>
  );
}


