import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout({ children, user }) {
  return (
    <div className="flex h-screen overflow-hidden bg-mesh" style={{ background: '#0b0f1a' }}>
      <Sidebar user={user} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar user={user} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
