import { Gameboard } from '@/components/gameboard';

export default function Page({ params }: { params: { name: string, turn: number } }) {
  return (
    <main className="m-2">
      <Gameboard name={params.name} turnNumber={params.turn} isPolling={false} />
    </main>
  );
}
