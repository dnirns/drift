import React from 'react';
import { Text } from 'react-native';

const MockIcon = ({ name, ...props }: { name: string }) => (
  <Text {...props}>{name}</Text>
);

export default MockIcon;
