import { Text, Title } from '@mantine/core';
import classes from './Welcome.module.css';

export function Welcome() {
  return (
    <>
      <Title className={classes.title} ta="center" mt={100}>
        Welcome to{' '}
        <Text inherit variant="gradient" component="span" gradient={{ from: 'pink', to: 'yellow' }}>
          Karaoke Machine
        </Text>
        <br />
        <Text inherit component="span" style={{ fontSize: '3rem' }}>
          Your solution to managing 3D print orders on Facebook Marketplace.
        </Text>
      </Title>
    </>
  );
}
