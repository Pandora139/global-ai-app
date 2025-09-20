import { Suspense } from 'react';
import ChatClient from './ChatClient';
import OptionMenu from '../../components/OptionMenu';



export default function ChatPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50 font-sans">
      <Suspense fallback={<div>Cargando...</div>}>
        <ChatClient />
      </Suspense>
    </main>
  );
}