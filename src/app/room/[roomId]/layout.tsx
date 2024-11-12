import { Metadata } from 'next';

type Props = {
  params: { roomId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Oda ${params.roomId}`,
    description: `Video görüşme odası ${params.roomId}`
  }
}

export default function RoomLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return <>{children}</>;
} 