import { useEffect, useState } from 'react';
import { tasksApi, Task, TaskStatus } from '../api/tasks';
import { TaskCard } from '../components/TaskCard';
import { Spinner } from '../components/ProtectedRoute';
import toast from 'react-hot-toast';

const STATUS_FILTERS: Array<{ label: string; value: TaskStatus | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
];

export function Admin() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  const fetchAll = async (page = 1, status?: TaskStatus) => {
    setIsLoading(true);
    try {
      const { data } = await tasksApi.adminGetAll({ page, limit: 12, status });
      setTasks(data.data.tasks);
      setPagination({
        page: data.data.page,
        limit: data.data.limit,
        total: data.data.total,
        totalPages: data.data.totalPages,
      });
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll(1, filter === 'ALL' ? undefined : filter);
  }, [filter]);

  const handleUpdate = async (id: string, data: Parameters<typeof tasksApi.update>[1]) => {
    const { data: res } = await tasksApi.update(id, data);
    setTasks((prev) => prev.map((t) => (t.id === id ? res.data : t)));
    toast.success('Task updated');
  };

  const handleDelete = async (id: string) => {
    await tasksApi.delete(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setPagination((p) => ({ ...p, total: p.total - 1 }));
    toast.success('Task deleted');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-slate-400 text-sm mt-1">{pagination.total} total tasks across all users</p>
        </div>
        <span className="badge-admin text-sm px-3 py-1">Admin View</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-slate-900 rounded-lg w-fit">
        {STATUS_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === value ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="card p-16 text-center text-slate-500">
          <p className="text-lg">No tasks found</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              showOwner
            />
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => fetchAll(pagination.page - 1, filter === 'ALL' ? undefined : filter)}
            disabled={pagination.page === 1}
            className="btn-secondary text-sm disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-slate-400 text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchAll(pagination.page + 1, filter === 'ALL' ? undefined : filter)}
            disabled={pagination.page === pagination.totalPages}
            className="btn-secondary text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
