import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../hooks/useTasks';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { Spinner } from '../components/ProtectedRoute';

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card p-5">
      <p className="text-slate-400 text-sm">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const { stats, tasks, isLoading, fetchTasks, fetchStats, createTask } = useTasks();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchTasks(1, 5);
    fetchStats();
  }, [fetchTasks, fetchStats]);

  const handleCreate = async (data: Parameters<typeof createTask>[0]) => {
    try {
      await createTask(data);
      setShowModal(false);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || 'Failed to create task');
      throw err;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Welcome back,{' '}
            <span className="text-slate-200">{user?.email}</span>{' '}
            <span className={user?.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}>
              {user?.role}
            </span>
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + New Task
        </button>
      </div>

      {/* Stats */}
      {stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Tasks" value={stats.total} color="text-slate-100" />
          <StatCard label="Completed" value={stats.completed} color="text-green-400" />
          <StatCard label="In Progress" value={stats.inProgress} color="text-blue-400" />
          <StatCard label="Pending" value={stats.pending} color="text-yellow-400" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-2/3 mb-3" />
              <div className="h-8 bg-slate-800 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Recent Tasks */}
      <div className="card">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="font-semibold">Recent Tasks</h2>
          <Link to="/tasks" className="text-sm text-blue-400 hover:text-blue-300">
            View all →
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Spinner />
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-lg">No tasks yet</p>
            <p className="text-sm mt-1">Create your first task to get started</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4">
              Create Task
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {tasks.map((task) => (
              <div key={task.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{task.title}</p>
                  {task.description && (
                    <p className="text-slate-400 text-sm truncate">{task.description}</p>
                  )}
                </div>
                <span
                  className={
                    task.status === 'COMPLETED'
                      ? 'badge-completed'
                      : task.status === 'IN_PROGRESS'
                      ? 'badge-in-progress'
                      : 'badge-pending'
                  }
                >
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <CreateTaskModal onClose={() => setShowModal(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
