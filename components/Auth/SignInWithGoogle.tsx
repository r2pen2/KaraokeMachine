'use client';

import React from 'react';
import { Button, Group, Text } from '@mantine/core';
import { IconBrandGoogle } from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';

export default function SignInWithGoogle() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) {
    return (
      <Group justify="center" p="md">
        <Text c="dimmed">Loading...</Text>
      </Group>
    );
  }

  if (user) {
    return (
      <Group justify="center" p="md">
        <Text>Signed in as {user.displayName || user.email}</Text>
        <Button variant="light" color="red" onClick={() => signOut()}>Sign out</Button>
      </Group>
    );
  }

  return (
    <Group justify="center" p="md">
      <Button leftSection={<IconBrandGoogle size={16} />} onClick={() => signInWithGoogle()}>
        Sign in with Google
      </Button>
    </Group>
  );
}


