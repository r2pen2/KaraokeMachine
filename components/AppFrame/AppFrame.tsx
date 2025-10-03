'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AppShell,
  Avatar,
  Burger,
  Button,
  Divider,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  ActionIcon,
} from '@mantine/core';
import { IconFilter, IconPlus, IconPackage, IconShoppingCart, IconPencil } from '@tabler/icons-react';
import AddProductModal from '../Products/AddProductModal';
import { useAuth } from '../../context/AuthContext';
import SignInWithGoogle from '../Auth/SignInWithGoogle';
import { useProducts } from '../../context/ProductsContext';


export default function AppFrame({ children }: { children: React.ReactNode }) {
  const [mobileOpened, setMobileOpened] = useState(false);
  const [desktopOpened, setDesktopOpened] = useState(true);
  const { user, signOut } = useAuth();

  const { products: userProducts } = useProducts();
  const [addOpen, setAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<typeof userProducts[number] | undefined>(undefined);
  const products = useMemo(() => userProducts.filter((p) => !p.hidden).sort((a, b) => a.title.localeCompare(b.title)), [userProducts]);

  function handleAddProduct() {
    setEditingProduct(undefined);
    setAddOpen(true);
  }

  function handleEditProduct(product: typeof userProducts[number]) {
    setEditingProduct(product);
    setAddOpen(true);
  }

  function handleCloseProductModal() {
    setAddOpen(false);
    setEditingProduct(undefined);
  }

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
          <Group gap="sm">
            <ActionIcon variant="subtle" onClick={handleAddProduct} title="Add Product">
              <IconPlus size={18} />
            </ActionIcon>
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
        <Stack gap="xs" style={{ height: '100%' }}>
          <NavLink
            component={Link}
            href="/orders"
            label="Orders"
            leftSection={<IconShoppingCart size={16} />}
          />
          <NavLink
            component={Link}
            href="/filaments"
            label="Filaments"
            leftSection={<IconFilter size={16} />}
          />
          <Divider label="Products" labelPosition="center" my="xs" />
          <ScrollArea style={{ flex: 1 }}>
            <Stack gap={4}>
              {products.map((p) => (
                <NavLink
                  key={p.id}
                  component={Link}
                  href={`/products/${p.id}`}
                  label={p.title}
                  leftSection={p.sketchDataUrl ? (
                    <img src={p.sketchDataUrl} alt="icon" style={{ width: 24, height: 24 }} />
                  ) : <IconPackage size={16} />}
                  rightSection={
                    <ActionIcon
                      variant="subtle"
                      size="xs"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEditProduct(p);
                      }}
                    >
                      <IconPencil size={12} />
                    </ActionIcon>
                  }
                />
              ))}
            </Stack>
          </ScrollArea>
        </Stack>
        <AddProductModal opened={addOpen} onClose={handleCloseProductModal} product={editingProduct} />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}


