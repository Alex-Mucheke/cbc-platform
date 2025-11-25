import {
  Home,
  BookOpen,
  FileText,
  GraduationCap,
  MessageSquare,
  Calendar,
  BarChart3,
  Settings,
  Users,
  Award,
  Clock,
} from 'lucide-react';
import { UserType } from '../../lib/supabase';

interface NavItem {
  icon: typeof Home;
  label: string;
  href: string;
  roles: UserType[];
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Dashboard', href: '/dashboard', roles: ['student', 'teacher', 'parent', 'admin'] },
  { icon: BookOpen, label: 'Digital Library', href: '/library', roles: ['student', 'teacher', 'admin'] },
  { icon: FileText, label: 'Exam Center', href: '/exams', roles: ['student', 'teacher', 'admin'] },
  { icon: GraduationCap, label: 'My Courses', href: '/courses', roles: ['student'] },
  { icon: Award, label: 'Achievements', href: '/achievements', roles: ['student'] },
  { icon: BarChart3, label: 'Performance', href: '/performance', roles: ['student', 'parent'] },
  { icon: Clock, label: 'Timetable', href: '/timetable', roles: ['student', 'teacher'] },
  { icon: Users, label: 'My Students', href: '/students', roles: ['teacher'] },
  { icon: FileText, label: 'Lesson Plans', href: '/lesson-plans', roles: ['teacher'] },
  { icon: Users, label: 'My Children', href: '/children', roles: ['parent'] },
  { icon: MessageSquare, label: 'Discussions', href: '/discussions', roles: ['student', 'teacher', 'parent'] },
  { icon: Calendar, label: 'Calendar', href: '/calendar', roles: ['student', 'teacher', 'parent', 'admin'] },
  { icon: Users, label: 'User Management', href: '/admin/users', roles: ['admin'] },
  { icon: Settings, label: 'Settings', href: '/settings', roles: ['student', 'teacher', 'parent', 'admin'] },
];

interface SidebarProps {
  userType: UserType;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function Sidebar({ userType, currentPath, onNavigate }: SidebarProps) {
  const filteredItems = navItems.filter((item) => item.roles.includes(userType));

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">CBC Learn</h1>
            <p className="text-xs text-gray-500">Kenya Education</p>
          </div>
        </div>

        <nav className="space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href;

            return (
              <button
                key={item.href}
                onClick={() => onNavigate(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
