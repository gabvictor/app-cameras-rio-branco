// Em declarations.d.ts

import * as React from 'react';
import { MapViewProps, Marker, LatLng } from 'react-native-maps';

// Adicionamos as propriedades específicas do clustering
interface ClusteringMapViewProps extends MapViewProps {
  // Cor do ícone do cluster
  clusterColor?: string;
  // Cor do texto dentro do cluster
  clusterTextColor?: string;
  // Raio da área de agrupamento
  radius?: number;
  // Outras props que a biblioteca possa ter...
  animationEnabled?: boolean;
  onClusterPress?: (cluster: { id: string, count: number, coordinate: LatLng }, markers: Marker[]) => void;
}

// Declaramos o módulo e exportamos o componente com as novas propriedades
declare module 'react-native-maps-clustering' {
  const MapView: React.ComponentType<ClusteringMapViewProps>;
  export default MapView;
  export { Marker }; // Re-exportamos o Marker para continuar funcionando
}