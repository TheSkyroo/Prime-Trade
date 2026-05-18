import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTasks } from '../hooks/useTasks';
import { TaskCard } from '../components/TaskCard';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { Spinner } from '../components/ProtectedRoute';
import { TaskStatus } from '../api/tasks';

const STATUS_FILTERS: Array<{ label: string; value: TaskStatus | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
];

export function Tasks() {
  const { tasks, pagination, isLoading, fetchTasks, createTask, updateTask, deleteTask } =
    useTasks();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<TaskStatus | 'ALL'>('ALL');

  useEffect(() => {
    fetchTasks(1, 10);
  }, [fetchTasks]);

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

  const filtered =
    filter === 'ALL' ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-slate-400 text-sm mt-1">{pagination.total} total tasks</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + New Task
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-slate-900 rounded-lg w-fit">
        {STATUS_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === value
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Task grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center text-slate-500">
          <p className="text-lg">
            {filter === 'ALL' ? 'No tasks yet' : `No ${filter.replace('_', ' ').toLowerCase()} tasks`}
          </p>
          {filter === 'ALL' && (
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4">
              Create your first task
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdate={updateTask}
              onDelete={deleteTask}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => fetchTasks(pagination.page - 1, pagination.limit)}
            disabled={pagination.page === 1}
            className="btn-secondary text-sm disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-slate-400 text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchTasks(pagination.page + 1, pagination.limit)}
            disabled={pagination.page === pagination.totalPages}
            className="btn-secondary text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      {showModal && (
        <CreateTaskModal onClose={() => setShowModal(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
