'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AppShell,
  Avatar,
  Burger,
  Button,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core';
import { IconFilter } from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import SignInWithGoogle from '../Auth/SignInWithGoogle';
import { getAllProducts } from '../../lib/mockDb';

const PRODUCT_HEADERS = getAllProducts();

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const [mobileOpened, setMobileOpened] = useState(false);
  const [desktopOpened, setDesktopOpened] = useState(true);
  const [productsOpened, setProductsOpened] = useState(true);
  const { user, signOut } = useAuth();

  const products = useMemo(() => PRODUCT_HEADERS, []);

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !mobileOpened, desktop: !desktopOpened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={mobileOpened} onClick={() => setMobileOpened((o) => !o)} hiddenFrom="sm" size="sm" />
            <Burger opened={desktopOpened} onClick={() => setDesktopOpened((o) => !o)} visibleFrom="sm" size="sm" />
          </Group>
          <Group>
            {user ? (
              <Group gap="sm">
                <Avatar src={user.photoURL || undefined} radius="xl" size={28}>
                  {user.displayName?.[0] ?? user.email?.[0] ?? 'U'}
                </Avatar>
                <Text size="sm" fw={500}>{user.displayName || user.email}</Text>
                <Button size="xs" variant="light" color="red" onClick={() => signOut()}>
                  Sign out
                </Button>
              </Group>
            ) : (
              <SignInWithGoogle />
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <AppShell.Section component={ScrollArea} grow>
          <Stack gap="xs">
            <NavLink
              component={Link}
              href="/filaments"
              label="Filaments"
              leftSection={<IconFilter size={16} />}
            />

            <NavLink
              label="Products"
              defaultOpened
              opened={productsOpened}
              onChange={(o) => setProductsOpened(Boolean(o))}
            >
              {products.map((p) => (
                <NavLink
                  key={p.id}
                  component={Link}
                  href={`/products/${p.id}`}
                  label={p.title}
                />
              ))}
            </NavLink>
          </Stack>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}


