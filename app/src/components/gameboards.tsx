'use client'

import { Gameboard } from '@/components/gameboard';
import { Navigation } from './navigation';

export function Gameboards({ name }: { name: string }) {
  return (
    <div className="m-2">
      <Navigation />
      
      <Gameboard name={name} />
    </div>
  );
}
