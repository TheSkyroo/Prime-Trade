import { useState, useCallback } from 'react';
import { tasksApi, Task, TasksResponse, TaskStats, TaskStatus } from '../api/tasks';
import toast from 'react-hot-toast';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTasks = useCallback(async (page = 1, limit = 10) => {
    setIsLoading(true);
    try {
      const { data } = await tasksApi.getAll({ page, limit });
      const r: TasksResponse = data.data;
      setTasks(r.tasks);
      setPagination({ page: r.page, limit: r.limit, total: r.total, totalPages: r.totalPages });
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await tasksApi.getStats();
      setStats(data.data);
    } catch {
      // silently fail
    }
  }, []);

  const createTask = useCallback(
    async (taskData: { title: string; description?: string; status?: TaskStatus }) => {
      const { data } = await tasksApi.create(taskData);
      setTasks((prev) => [data.data, ...prev]);
      toast.success('Task created');
      fetchStats();
      return data.data;
    },
    [fetchStats]
  );

  const updateTask = useCallback(
    async (id: string, taskData: { title?: string; description?: string; status?: TaskStatus }) => {
      const { data } = await tasksApi.update(id, taskData);
      setTasks((prev) => prev.map((t) => (t.id === id ? data.data : t)));
      toast.success('Task updated');
      fetchStats();
    },
    [fetchStats]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      await tasksApi.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success('Task deleted');
      fetchStats();
    },
    [fetchStats]
  );

  return {
    tasks,
    pagination,
    stats,
    isLoading,
    fetchTasks,
    fetchStats,
    createTask,
    updateTask,
    deleteTask,
  };
}
