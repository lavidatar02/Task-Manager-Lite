import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Circle,
  Info,
  LogOut,
  Moon,
  Palette,
  Pencil,
  Plus,
  Search,
  Settings2,
  Sun,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';

type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
type TaskPriority = 'Critical' | 'High' | 'Medium' | 'Low';
type Appearance = 'light' | 'dark';
type SettingsDialog = 'profile' | 'appearance' | 'about' | null;

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
};

type TaskDraft = {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
};

const STORAGE_KEY = 'codynn-tasks-v2';
const TASK_CONTENT_VERSION_KEY = 'lavi-task-content-version';
const TASK_CONTENT_VERSION = 'v4';
const PROFILE_KEY = 'lavi-profile-name';
const APPEARANCE_KEY = 'lavi-appearance';

const seedTasks: Task[] = [
  {
    id: 'task-python-assignment',
    title: 'Complete Python Assignment',
    status: 'Pending',
    priority: 'Medium',
    createdAt: '2026-07-25T09:00:00.000Z',
  },
  {
    id: 'task-portfolio-website',
    title: 'Build Personal Portfolio Website',
    status: 'In Progress',
    priority: 'Critical',
    createdAt: '2026-07-25T09:10:00.000Z',
  },
  {
    id: 'task-practice-python-java-html',
    title: "I'm Currently Practicing Python, Java and HTML",
    status: 'In Progress',
    priority: 'High',
    createdAt: '2026-07-25T09:20:00.000Z',
  },
  {
    id: 'task-database-notes',
    title: 'Read Database Notes',
    status: 'Pending',
    priority: 'Low',
    createdAt: '2026-07-25T09:30:00.000Z',
  },
  {
    id: 'task-student-management-system',
    title: 'Student Management System Project',
    status: 'Completed',
    priority: 'Critical',
    createdAt: '2026-07-25T09:40:00.000Z',
  },
];

const previousSeedTaskIds = new Set([
  'task-codynn-1',
  'task-codynn-2',
  'task-codynn-3',
]);

const initialDraft: TaskDraft = {
  title: '',
  status: 'Pending',
  priority: 'Medium',
};

function readProfileName() {
  try {
    return window.localStorage.getItem(PROFILE_KEY)?.trim() || 'Lavi';
  } catch {
    return 'Lavi';
  }
}

function readAppearance(): Appearance {
  try {
    return window.localStorage.getItem(APPEARANCE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function normalizePriority(priority: unknown): TaskPriority {
  if (priority === 'Critical' || priority === 'High' || priority === 'Medium' || priority === 'Low') {
    return priority;
  }
  if (priority === 'Normal') return 'Medium';
  if (priority === 'Minor') return 'Low';
  return 'Medium';
}

function readTasks(): Task[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Task[];
      if (Array.isArray(parsed)) {
        if (
          parsed.length === previousSeedTaskIds.size &&
          parsed.every((task) => previousSeedTaskIds.has(task.id))
        ) {
          window.localStorage.setItem(TASK_CONTENT_VERSION_KEY, TASK_CONTENT_VERSION);
          return seedTasks;
        }
        const contentVersion = window.localStorage.getItem(TASK_CONTENT_VERSION_KEY);
        const referenceTaskIds = new Set(seedTasks.map((task) => task.id));
        if (
          contentVersion !== TASK_CONTENT_VERSION &&
          parsed.length === seedTasks.length &&
          parsed.every((task) => referenceTaskIds.has(task.id))
        ) {
          window.localStorage.setItem(TASK_CONTENT_VERSION_KEY, TASK_CONTENT_VERSION);
          return seedTasks;
        }
        return parsed.map((task) => ({
          ...task,
          priority: normalizePriority(task.priority),
        }));
      }
    }
  } catch {
    // Start with the reference tasks if browser storage is unavailable.
  }
  return seedTasks;
}

function getTimeGreeting(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(readTasks);
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TaskDraft>(initialDraft);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [profileName, setProfileName] = useState(readProfileName);
  const [profileDraft, setProfileDraft] = useState(readProfileName);
  const [appearance, setAppearance] = useState<Appearance>(readAppearance);
  const [settingsDialog, setSettingsDialog] = useState<SettingsDialog>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    window.localStorage.setItem(PROFILE_KEY, profileName);
  }, [profileName]);

  useEffect(() => {
    window.localStorage.setItem(APPEARANCE_KEY, appearance);
    document.documentElement.dataset.theme = appearance;
  }, [appearance]);

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const closeMenus = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotificationsOpen(false);
        setAccountOpen(false);
        setAccountSettingsOpen(false);
        setSettingsDialog(null);
      }
    };
    window.addEventListener('keydown', closeMenus);
    return () => window.removeEventListener('keydown', closeMenus);
  }, []);

  const completedCount = tasks.filter((task) => task.status === 'Completed').length;
  const pendingCount = tasks.filter((task) => task.status === 'Pending').length;
  const completionRate = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;
  const timeGreeting = getTimeGreeting(currentTime);
  const hasNotifications = pendingCount > 0 || completedCount > 0;
  const profileInitial = profileName.charAt(0).toUpperCase() || 'L';

  const matchesSearch = (task: Task) =>
    !query.trim() || task.title.toLowerCase().includes(query.trim().toLowerCase());

  const onHoldTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.status !== 'Completed' && matchesSearch(task))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [query, tasks],
  );

  const completedTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.status === 'Completed' && matchesSearch(task))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [query, tasks],
  );

  const openModal = (task?: Task) => {
    if (task) {
      setEditingId(task.id);
      setDraft({
        title: task.title,
        status: task.status,
        priority: task.priority,
      });
    } else {
      setEditingId(null);
      setDraft(initialDraft);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setDraft(initialDraft);
  };

  const saveTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = draft.title.trim();
    if (!title) return;

    if (editingId) {
      setTasks((current) =>
        current.map((task) =>
          task.id === editingId ? { ...task, ...draft, title } : task,
        ),
      );
    } else {
      setTasks((current) => [
        {
          id: `task-${Date.now()}`,
          title,
          status: draft.status,
          priority: draft.priority,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);
    }
    closeModal();
  };

  const toggleTask = (task: Task) => {
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? {
              ...item,
              status: item.status === 'Completed' ? 'Pending' : 'Completed',
            }
          : item,
      ),
    );
  };

  const deleteTask = (task: Task) => {
    if (window.confirm(`Delete “${task.title}”?`)) {
      setTasks((current) => current.filter((item) => item.id !== task.id));
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background px-3 py-8 text-foreground sm:px-6 sm:py-12">
      <div className="app-shell mx-auto w-full max-w-[1120px] overflow-hidden rounded-[18px] border border-border bg-card shadow-[0_10px_32px_rgba(31,35,53,.08)]">
        <header className="topbar flex min-h-[70px] items-center justify-between gap-4 border-b border-border px-6 py-3.5 sm:px-8">
          <label className="search-field relative block w-full max-w-[320px]">
            <span className="sr-only">Search tasks</span>
            <Search
              size={18}
              strokeWidth={1.8}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a4a6b1]"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for any training you want"
              aria-label="Search tasks"
              className="h-10 w-full rounded-full border border-[#ebebef] bg-[#fafafd] pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-[#a4a6b1] focus:border-primary focus:ring-2 focus:ring-primary/15"
              data-testid="input-search-tasks"
            />
          </label>
          <div className="relative flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((open) => !open);
                setAccountOpen(false);
                setNotificationsRead(true);
              }}
              aria-expanded={notificationsOpen}
              aria-controls="notifications-panel"
              className={`notification-button relative flex h-10 w-10 items-center justify-center rounded-full border bg-white transition ${
                notificationsOpen
                  ? 'border-primary text-primary shadow-[0_3px_10px_rgba(112,22,248,.14)]'
                  : 'border-[#e9e9ee] text-[#858792] hover:border-primary hover:text-primary'
              }`}
              aria-label="Notifications"
              data-testid="button-notifications"
            >
              <Bell size={18} strokeWidth={1.8} />
              {hasNotifications && !notificationsRead && (
                <span className="absolute right-[8px] top-[7px] h-1.5 w-1.5 rounded-full bg-[#f42145]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setAccountOpen((open) => !open);
                setNotificationsOpen(false);
                setAccountSettingsOpen(false);
              }}
              aria-expanded={accountOpen}
              aria-controls="account-panel"
              className={`flex h-10 w-10 items-center justify-center rounded-full text-white transition ${
                accountOpen ? 'bg-primary' : 'bg-[#1f2938] hover:bg-[#2f3b4d]'
              }`}
              aria-label="User profile"
              data-testid="button-profile"
            >
              <UserRound size={17} strokeWidth={1.8} />
            </button>

            {notificationsOpen && (
              <NotificationsPanel
                pendingCount={pendingCount}
                completedCount={completedCount}
                onClose={() => setNotificationsOpen(false)}
              />
            )}
            {accountOpen && (
              <AccountPanel
                profileName={profileName}
                profileInitial={profileInitial}
                appearance={appearance}
                settingsOpen={accountSettingsOpen}
                onClose={() => {
                  setAccountOpen(false);
                  setAccountSettingsOpen(false);
                }}
                onOpenSettings={() => setAccountSettingsOpen(true)}
                onBack={() => setAccountSettingsOpen(false)}
                onOpenDialog={(dialog) => {
                  if (dialog === 'profile') setProfileDraft(profileName);
                  setSettingsDialog(dialog);
                  setAccountOpen(false);
                  setAccountSettingsOpen(false);
                }}
              />
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_207px]">
          <main className="min-w-0 px-6 py-7 sm:px-8 sm:py-8">
            <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mb-2 text-[15px] text-[#a1a3ad]">
                  {timeGreeting}, {profileName}
                </p>
                <h1 className="text-[26px] font-semibold leading-tight tracking-[-.045em] text-[#171c29] sm:text-[28px]">
                  You&apos;ve got <span className="text-[#ff771c]">{tasks.length}</span>{' '}
                  task today
                </h1>
              </div>
              <button
                type="button"
                onClick={() => openModal()}
                className="add-new-button inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-[7px] bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_5px_12px_rgba(112,22,248,.2)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(112,22,248,.28)] sm:self-center"
                data-testid="button-add-task"
              >
                <Plus size={16} strokeWidth={2.4} /> Add New
              </button>
            </section>

            <section className="mt-7">
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-[17px] font-semibold tracking-[-.02em]">On Hold</h2>
                {query && (
                  <span className="rounded-full bg-[#f4f2fa] px-2 py-0.5 text-[11px] text-[#9a9ba5]">
                    Search results
                  </span>
                )}
              </div>
              <div className="divide-y divide-[#f0f0f3]">
                {onHoldTasks.length > 0 ? (
                  onHoldTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                      onEdit={openModal}
                      onDelete={deleteTask}
                    />
                  ))
                ) : (
                  <EmptyTaskState
                    message={query ? 'No tasks match your search' : 'No tasks on hold'}
                  />
                )}
              </div>
            </section>

            <section className="mt-7">
              <div className="mb-2 flex items-center gap-2">
                <h2 className="text-[17px] font-semibold tracking-[-.02em]">Completed</h2>
                <span className="rounded-[4px] bg-[#f2f2f4] px-2 py-0.5 text-[10px] font-medium text-[#9b9ca5]">
                  Inactive
                </span>
              </div>
              {completedTasks.length > 0 ? (
                <div className="divide-y divide-[#f0f0f3]">
                  {completedTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                      onEdit={openModal}
                      onDelete={deleteTask}
                    />
                  ))}
                </div>
              ) : (
                <p className="py-2 text-sm text-[#a7a8b1]">
                  {query ? 'No completed tasks match your search' : 'No completed tasks'}
                </p>
              )}
            </section>
          </main>

          <aside className="summary-panel border-t border-border px-6 py-7 md:border-l md:border-t-0 md:px-5 md:py-7">
            <h2 className="mb-5 text-[14px] font-semibold tracking-[-.02em]">Results Summary</h2>
            <SummaryMetric label="Completion Rate" value={`${completionRate}%`} showBar />
            <SummaryMetric label="Total Tasks" value={tasks.length} />
            <SummaryMetric label="Completed" value={completedCount} />
            <SummaryMetric label="Pending" value={pendingCount} last />
          </aside>
        </div>
      </div>

      {modalOpen && (
        <TaskModal
          editing={Boolean(editingId)}
          draft={draft}
          setDraft={setDraft}
          onClose={closeModal}
          onSave={saveTask}
        />
      )}
      {settingsDialog === 'profile' && (
        <ProfileDialog
          profileName={profileDraft}
          onChange={setProfileDraft}
          onClose={() => setSettingsDialog(null)}
          onSave={() => {
            const nextName = profileDraft.trim();
            if (nextName) setProfileName(nextName);
            setSettingsDialog(null);
          }}
        />
      )}
      {settingsDialog === 'appearance' && (
        <AppearanceDialog
          appearance={appearance}
          onChange={setAppearance}
          onClose={() => setSettingsDialog(null)}
        />
      )}
      {settingsDialog === 'about' && <AboutDialog onClose={() => setSettingsDialog(null)} />}
    </div>
  );
}

function NotificationsPanel({
  pendingCount,
  completedCount,
  onClose,
}: {
  pendingCount: number;
  completedCount: number;
  onClose: () => void;
}) {
  const hasUpdates = pendingCount > 0 || completedCount > 0;

  return (
    <div
      id="notifications-panel"
      role="region"
      aria-label="Notifications"
      className="popover-panel absolute right-0 top-[calc(100%+12px)] z-40 w-[290px] rounded-[12px] border border-[#e7e6ed] bg-white p-4 shadow-[0_15px_35px_rgba(35,35,55,.16)]"
      data-testid="panel-notifications"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-semibold text-[#222737]">Notifications</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-[#9a9ca7] hover:bg-[#f4f3f8] hover:text-[#454754]"
          aria-label="Close notifications"
          data-testid="button-close-notifications"
        >
          <X size={15} />
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {pendingCount > 0 && (
          <div className="flex gap-3 rounded-[9px] bg-[#fff8ee] p-3">
            <CircleAlert size={17} className="mt-0.5 shrink-0 text-[#d88a34]" />
            <div>
              <p className="text-[12px] font-semibold text-[#48434a]">
                Tasks need your attention
              </p>
              <p className="mt-0.5 text-[11px] leading-4 text-[#96919a]">
                {pendingCount} open {pendingCount === 1 ? 'task is' : 'tasks are'} waiting in
                your list.
              </p>
            </div>
          </div>
        )}
        {completedCount > 0 && (
          <div className="flex gap-3 rounded-[9px] bg-[#effaf5] p-3">
            <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#36a078]" />
            <div>
              <p className="text-[12px] font-semibold text-[#48434a]">Nice progress</p>
              <p className="mt-0.5 text-[11px] leading-4 text-[#96919a]">
                {completedCount} {completedCount === 1 ? 'task is' : 'tasks are'} completed.
              </p>
            </div>
          </div>
        )}
        {!hasUpdates && (
          <p className="rounded-[9px] bg-[#f7f7fa] px-3 py-4 text-center text-[12px] text-[#9699a4]">
            You&apos;re all caught up.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-3 w-full rounded-[7px] bg-[#f5f3ff] py-2 text-[11px] font-semibold text-primary hover:bg-[#eeeaff]"
        data-testid="button-dismiss-notifications"
      >
        Done
      </button>
    </div>
  );
}

function AccountPanel({
  profileName,
  profileInitial,
  appearance,
  settingsOpen,
  onClose,
  onOpenSettings,
  onBack,
  onOpenDialog,
}: {
  profileName: string;
  profileInitial: string;
  appearance: Appearance;
  settingsOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onBack: () => void;
  onOpenDialog: (dialog: Exclude<SettingsDialog, null>) => void;
}) {
  return (
    <div
      id="account-panel"
      role="region"
      aria-label={settingsOpen ? 'Account settings' : 'Account status'}
      className="popover-panel account-panel absolute right-0 top-[calc(100%+12px)] z-40 w-[270px] rounded-[12px] border border-[#e7e6ed] bg-white p-4 shadow-[0_15px_35px_rgba(35,35,55,.16)]"
      data-testid="panel-account"
    >
      {settingsOpen ? (
        <>
          <div className="flex items-center gap-2 border-b border-[#f0eff3] pb-3">
            <button
              type="button"
              onClick={onBack}
              className="rounded-md p-1 text-[#9698a3] hover:bg-[#f5f3fa] hover:text-primary"
              aria-label="Back to account menu"
              data-testid="button-account-settings-back"
            >
              <ArrowLeft size={15} />
            </button>
            <h2 className="text-[14px] font-semibold text-[#222737]">Account settings</h2>
          </div>
          <div className="mt-3 space-y-1">
            <button
              type="button"
              onClick={() => onOpenDialog('profile')}
              className="account-setting-item flex w-full items-center gap-3 rounded-[8px] px-2.5 py-2.5 text-left text-[12px] text-[#696b76] hover:bg-[#f6f5fa] hover:text-primary"
              data-testid="button-edit-profile"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1eaff] text-primary">
                <Pencil size={14} />
              </span>
              <span>
                <span className="block font-semibold text-[#3e4050]">Edit Profile</span>
                <span className="mt-0.5 block text-[10px] text-[#a1a2ac]">Change your display name</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => onOpenDialog('appearance')}
              className="account-setting-item flex w-full items-center gap-3 rounded-[8px] px-2.5 py-2.5 text-left text-[12px] text-[#696b76] hover:bg-[#f6f5fa] hover:text-primary"
              data-testid="button-appearance"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fff3df] text-[#d88935]">
                {appearance === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
              </span>
              <span>
                <span className="block font-semibold text-[#3e4050]">Appearance</span>
                <span className="mt-0.5 block text-[10px] text-[#a1a2ac]">
                  {appearance === 'dark' ? 'Dark theme' : 'Light theme'}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => onOpenDialog('about')}
              className="account-setting-item flex w-full items-center gap-3 rounded-[8px] px-2.5 py-2.5 text-left text-[12px] text-[#696b76] hover:bg-[#f6f5fa] hover:text-primary"
              data-testid="button-about"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eaf7ff] text-[#3284b2]">
                <Info size={14} />
              </span>
              <span>
                <span className="block font-semibold text-[#3e4050]">About</span>
                <span className="mt-0.5 block text-[10px] text-[#a1a2ac]">Learn about Lavi Tasks</span>
              </span>
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 border-b border-[#f0eff3] pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7921f5] text-xs font-semibold text-white">
              {profileInitial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-[#222737]">{profileName}</p>
              <p className="truncate text-[11px] text-[#9a9ca7]">Personal workspace</p>
            </div>
            <span className="ml-auto h-2.5 w-2.5 rounded-full bg-[#16c978]" title="Online" />
          </div>
          <div className="mt-3 rounded-[9px] bg-[#f5fdf8] p-3">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-[#307b5e]">
              <span className="h-2 w-2 rounded-full bg-[#16c978]" />
              Account active
            </div>
            <p className="mt-1 text-[11px] leading-4 text-[#8d9c93]">
              Your task list is saved locally on this device.
            </p>
          </div>
          <div className="mt-3 space-y-1">
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex w-full items-center gap-2 rounded-[7px] px-2 py-2 text-left text-[12px] text-[#696b76] hover:bg-[#f6f5fa] hover:text-primary"
              data-testid="button-account-settings"
            >
              <Settings2 size={15} /> Account settings
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex w-full items-center gap-2 rounded-[7px] px-2 py-2 text-left text-[12px] text-[#696b76] hover:bg-[#fff1f3] hover:text-destructive"
              data-testid="button-account-close"
            >
              <LogOut size={15} /> Close account menu
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SettingsDialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#24252d]/50 p-0 backdrop-blur-[2px] animate-veil sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
        className="settings-dialog w-full max-w-[400px] rounded-t-[18px] border border-border bg-card p-6 shadow-[0_24px_80px_rgba(38,35,66,.22)] animate-pop sm:rounded-[17px] sm:p-7"
      >
        <div className="flex items-start justify-between">
          <h2 id="settings-dialog-title" className="text-[20px] font-semibold tracking-[-.03em]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label={`Close ${title}`}
            data-testid={`button-close-${title.toLowerCase().replaceAll(' ', '-')}`}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ProfileDialog({
  profileName,
  onChange,
  onClose,
  onSave,
}: {
  profileName: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <SettingsDialog title="Edit Profile" onClose={onClose}>
      <form
        className="mt-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-medium text-[#4c4f5a]">Display name</span>
          <input
            autoFocus
            required
            value={profileName}
            onChange={(event) => onChange(event.target.value)}
            className="h-11 w-full rounded-[7px] border border-[#dedee5] bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-3 focus:ring-primary/10"
            data-testid="input-profile-name"
          />
        </label>
        <p className="mt-2 text-[11px] leading-4 text-[#999ba6]">
          This name appears in your greeting and account menu.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-[7px] bg-[#f3f4f7] px-4 text-sm font-semibold text-[#5f626d] hover:bg-[#e9eaf0]"
            data-testid="button-cancel-profile"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="h-10 rounded-[7px] bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_5px_13px_rgba(112,22,248,.2)]"
            data-testid="button-save-profile"
          >
            Save changes
          </button>
        </div>
      </form>
    </SettingsDialog>
  );
}

function AppearanceDialog({
  appearance,
  onChange,
  onClose,
}: {
  appearance: Appearance;
  onChange: (appearance: Appearance) => void;
  onClose: () => void;
}) {
  return (
    <SettingsDialog title="Appearance" onClose={onClose}>
      <div className="mt-5 space-y-2">
        <p className="mb-3 text-[12px] text-[#8f919c]">Choose how Lavi Tasks looks on this device.</p>
        {(['light', 'dark'] as Appearance[]).map((option) => {
          const selected = appearance === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`flex w-full items-center gap-3 rounded-[9px] border p-3 text-left transition ${
                selected
                  ? 'border-primary bg-[#f5f0ff] text-primary'
                  : 'border-[#e8e7ed] bg-white text-[#686a75] hover:border-[#cdb8f7]'
              }`}
              data-testid={`button-appearance-${option}`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f1f8]">
                {option === 'light' ? <Sun size={17} /> : <Moon size={17} />}
              </span>
              <span className="flex-1">
                <span className="block text-[13px] font-semibold capitalize">{option}</span>
                <span className="mt-0.5 block text-[11px] text-[#999ba6]">
                  {option === 'light' ? 'Soft white workspace' : 'Low-light workspace'}
                </span>
              </span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  selected ? 'border-primary bg-primary text-white' : 'border-[#d5d4dc]'
                }`}
              >
                {selected && <Check size={12} strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-5 h-10 w-full rounded-[7px] bg-primary text-sm font-semibold text-primary-foreground"
        data-testid="button-close-appearance"
      >
        Done
      </button>
    </SettingsDialog>
  );
}

function AboutDialog({ onClose }: { onClose: () => void }) {
  return (
    <SettingsDialog title="About Lavi Tasks" onClose={onClose}>
      <div className="mt-5 rounded-[12px] bg-[#f7f4ff] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-primary text-lg font-semibold text-white">
            L
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#252839]">Lavi Tasks</p>
            <p className="text-[11px] text-[#9597a3]">Simple work, clearly organized.</p>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-[12px] leading-5 text-[#777986]">
        <p>Keep your tasks moving with statuses, priorities, search, and quick updates.</p>
        <p>Your task list and preferences are saved locally on this device.</p>
        <p className="text-[11px] text-[#a1a2ac]">Version 1.0 · Personal workspace</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-5 h-10 w-full rounded-[7px] bg-primary text-sm font-semibold text-primary-foreground"
        data-testid="button-close-about"
      >
        Close
      </button>
    </SettingsDialog>
  );
}

function TaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const statusStyles: Record<TaskStatus, string> = {
    Pending: 'bg-[#fff1d8] text-[#bd7b28]',
    'In Progress': 'bg-[#f0e7ff] text-[#7138cc]',
    Completed: 'bg-[#e8f7ef] text-[#2f8b65]',
  };
  const priorityStyles: Record<TaskPriority, string> = {
    Critical: 'text-[#d55c69]',
    High: 'text-[#d88935]',
    Medium: 'text-[#888a93]',
    Low: 'text-[#888a93]',
  };

  return (
    <article
      className={`task-row flex min-h-[48px] items-center gap-3 py-2.5 ${task.status === 'Completed' ? 'done' : ''}`}
      data-testid={`row-task-${task.id}`}
    >
      <button
        type="button"
        onClick={() => onToggle(task)}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
          task.status === 'Completed'
            ? 'border-primary bg-primary text-white'
            : 'border-[#f2789d] text-transparent hover:bg-[#fff2f6]'
        }`}
        aria-label={
          task.status === 'Completed'
            ? `Mark ${task.title} as pending`
            : `Complete ${task.title}`
        }
        data-testid={`button-toggle-task-${task.id}`}
      >
        {task.status === 'Completed' ? (
          <Check size={12} strokeWidth={3} />
        ) : (
          <Circle size={7} fill="currentColor" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div
          className="task-title text-[14px] text-[#5f626e] sm:text-[15px]"
          data-testid={`text-task-title-${task.id}`}
        >
          {task.title}
        </div>
      </div>

      <div className="task-meta flex shrink-0 items-center gap-3">
        <span
          className={`rounded-full px-2 py-1 text-[11px] font-medium ${statusStyles[task.status]}`}
          data-testid={`status-task-${task.id}`}
        >
          {task.status}
        </span>
        <span
          className={`flex items-center gap-1.5 text-[11px] font-medium ${priorityStyles[task.priority]}`}
          data-testid={`priority-task-${task.id}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              task.priority === 'Critical'
                ? 'bg-[#f27987]'
                : task.priority === 'High'
                  ? 'bg-[#f0a34e]'
                  : task.priority === 'Medium'
                    ? 'bg-[#16c978]'
                    : 'bg-[#a9abb5]'
            }`}
          />
          {task.priority}
        </span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7921f5] text-[10px] font-semibold text-white">
          CF
        </span>
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="rounded p-1 text-[#a5a7b0] transition hover:bg-[#f4f0ff] hover:text-primary"
          aria-label={`Edit ${task.title}`}
          data-testid={`button-edit-task-${task.id}`}
        >
          <Pencil size={15} strokeWidth={1.7} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task)}
          className="rounded p-1 text-[#a5a7b0] transition hover:bg-[#fff0f2] hover:text-destructive"
          aria-label={`Delete ${task.title}`}
          data-testid={`button-delete-task-${task.id}`}
        >
          <Trash2 size={15} strokeWidth={1.7} />
        </button>
      </div>
    </article>
  );
}

function SummaryMetric({
  label,
  value,
  showBar = false,
  last = false,
}: {
  label: string;
  value: string | number;
  showBar?: boolean;
  last?: boolean;
}) {
  return (
    <div className={`summary-metric py-3.5 ${last ? '' : 'border-b border-[#f0f0f2]'}`}>
      <div className="text-[12px] text-[#9a9ca7]">{label}</div>
      <div className="mt-1 text-[26px] font-semibold tracking-[-.04em] text-[#1d2431]">
        {value}
      </div>
      {showBar && (
        <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-[#ececef]">
          <div className="h-full w-0 rounded-full bg-primary transition-all" />
        </div>
      )}
    </div>
  );
}

function EmptyTaskState({ message }: { message: string }) {
  return <p className="py-3 text-sm text-[#a7a8b1]">{message}</p>;
}

function TaskModal({
  editing,
  draft,
  setDraft,
  onClose,
  onSave,
}: {
  editing: boolean;
  draft: TaskDraft;
  setDraft: React.Dispatch<React.SetStateAction<TaskDraft>>;
  onClose: () => void;
  onSave: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#24252d]/50 p-0 backdrop-blur-[2px] animate-veil sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
          className="task-dialog w-full max-w-[430px] rounded-t-[18px] border border-border bg-card p-6 shadow-[0_24px_80px_rgba(38,35,66,.22)] animate-pop sm:rounded-[17px] sm:p-7"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 id="task-modal-title" className="text-[20px] font-semibold tracking-[-.03em]">
              {editing ? 'Add / Update Task' : 'Add / Update Task'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Close task dialog"
            data-testid="button-close-task-modal"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={onSave} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium text-[#4c4f5a]">Task Title</span>
            <input
              autoFocus
              required
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Enter task title"
              className="h-11 w-full rounded-[7px] border border-[#dedee5] bg-white px-3 text-sm outline-none transition placeholder:text-[#b6b7bf] focus:border-primary focus:ring-3 focus:ring-primary/10"
              data-testid="input-task-title"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium text-[#4c4f5a]">Status</span>
            <div className="relative">
              <select
                value={draft.status}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    status: event.target.value as TaskStatus,
                  }))
                }
                className="h-11 w-full appearance-none rounded-[7px] border border-[#dedee5] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                data-testid="select-task-status"
              >
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium text-[#4c4f5a]">Priority</span>
            <div className="relative">
              <select
                value={draft.priority}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    priority: event.target.value as TaskPriority,
                  }))
                }
                className="h-11 w-full appearance-none rounded-[7px] border border-[#dedee5] bg-white px-3 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                data-testid="select-task-priority"
              >
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </div>
          </label>
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[7px] bg-[#f3f4f7] px-4 text-sm font-semibold text-[#5f626d] transition hover:bg-[#e9eaf0]"
              data-testid="button-cancel-task"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 rounded-[7px] bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_5px_13px_rgba(112,22,248,.2)] transition hover:-translate-y-0.5"
              data-testid="button-save-task"
            >
              Save Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;