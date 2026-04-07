declare module '@expo/vector-icons/MaterialIcons' {
  import { ComponentType } from 'react';

  interface IconProps {
    name: string;
    size?: number;
    color?: string;
  }

  const MaterialIcons: ComponentType<IconProps>;
  export default MaterialIcons;
}
