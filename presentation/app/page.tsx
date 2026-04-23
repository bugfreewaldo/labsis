import { Deck } from '@/components/Deck';
import { slides } from './slides';

export default function Page() {
  return <Deck slides={slides} />;
}
