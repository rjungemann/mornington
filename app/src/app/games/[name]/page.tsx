import { Gameboard } from '@/components/gameboard';

export default function Page({ params }: { params: { name: string } }) {
  return (
    <main className="m-2">
      <Gameboard name={params.name} isPolling={true} />
    </main>
  );
}
