import { CentralWorkHub } from './furniture/CentralWorkHub';
import { CoffeeLounge } from './furniture/CoffeeLounge';
import { MeetingZone } from './furniture/MeetingZone';
import { PrivateDesk } from './furniture/PrivateDesk';
import { Plant } from './furniture/Plants';
import { PERIMETER_PLANTS } from '@/components/office/config/officePerimeterPlants';

export function OfficeLayout() {
  return (
    <group>
      <CentralWorkHub />
      <CoffeeLounge />
      <MeetingZone />
      <PrivateDesk />

      {PERIMETER_PLANTS.map((plant, index) => (
        <Plant key={`perimeter-${index}`} position={plant.position} variant={plant.variant} />
      ))}
    </group>
  );
}
