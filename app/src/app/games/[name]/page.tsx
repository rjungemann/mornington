import { Gameboards } from '@/components/gameboards';

export default function Page({ params }: { params: { name: string } }) {
  return (
    <main className="m-2">
      <Gameboards name={params.name} />
    </main>
  );
}
