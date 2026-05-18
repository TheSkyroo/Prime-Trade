import { useState } from 'react';
import { Task, TaskStatus } from '../api/tasks';

interface Props {
  task: Task;
  onUpdate: (id: string, data: { title?: string; description?: string; status?: TaskStatus }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  showOwner?: boolean;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

const STATUS_BADGE: Record<TaskStatus, string> = {
  PENDING: 'badge-pending',
  IN_PROGRESS: 'badge-in-progress',
  COMPLETED: 'badge-completed',
};

export function TaskCard({ task, onUpdate, onDelete, showOwner }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = async () => {
    if (!editData.title.trim() || editData.title.length < 3) return;
    setIsSaving(true);
    try {
      await onUpdate(task.id, {
        title: editData.title,
        description: editData.description || undefined,
        status: editData.status,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(task.id);
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (isEditing) {
    return (
      <div className="card p-4 space-y-3">
        <input
          className="input text-sm"
          value={editData.title}
          onChange={(e) => setEditData((d) => ({ ...d, title: e.target.value }))}
          placeholder="Task title"
        />
        <textarea
          className="input text-sm resize-none"
          rows={2}
          value={editData.description}
          onChange={(e) => setEditData((d) => ({ ...d, description: e.target.value }))}
          placeholder="Description (optional)"
        />
        <select
          className="input text-sm"
          value={editData.status}
          onChange={(e) => setEditData((d) => ({ ...d, status: e.target.value as TaskStatus }))}
        >
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button className="btn-primary text-sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button className="btn-ghost text-sm" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4 space-y-2 hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-slate-100 leading-tight">{task.title}</h3>
        <span className={STATUS_BADGE[task.status]}>{STATUS_LABELS[task.status]}</span>
      </div>

      {task.description && (
        <p className="text-slate-400 text-sm leading-relaxed">{task.description}</p>
      )}

      {showOwner && task.user && (
        <p className="text-xs text-slate-500">Owner: {task.user.email}</p>
      )}

      <p className="text-xs text-slate-600">
        {new Date(task.updatedAt).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        })}
      </p>

      <div className="flex gap-2 pt-1">
        <button className="btn-secondary text-xs px-2.5 py-1" onClick={() => setIsEditing(true)}>
          Edit
        </button>
        {!confirmDelete ? (
          <button
            className="btn-ghost text-xs px-2.5 py-1 text-red-400 hover:text-red-300"
            onClick={() => setConfirmDelete(true)}
          >
            Delete
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400">Sure?</span>
            <button
              className="btn-danger text-xs px-2 py-0.5"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? '...' : 'Yes'}
            </button>
            <button
              className="btn-ghost text-xs px-2 py-0.5"
              onClick={() => setConfirmDelete(false)}
            >
              No
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
