import { Users, FileText, BookOpen, TrendingUp, Calendar, Clock } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export function TeacherDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Teacher Dashboard</h1>
        <p className="text-gray-600">Manage your classes, create content, and track student progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">142</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Lesson Plans</p>
              <p className="text-2xl font-bold text-gray-900">28</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Assessments</p>
              <p className="text-2xl font-bold text-gray-900">15</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Class Average</p>
              <p className="text-2xl font-bold text-gray-900">82%</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">My Classes</h3>
                <Button size="sm">View All</Button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {[
                  { grade: 'Grade 7A', subject: 'Mathematics', students: 35, avgScore: 85 },
                  { grade: 'Grade 7B', subject: 'Mathematics', students: 38, avgScore: 78 },
                  { grade: 'Grade 8A', subject: 'Mathematics', students: 32, avgScore: 82 },
                  { grade: 'Grade 6C', subject: 'Science', students: 37, avgScore: 80 },
                ].map((classItem, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{classItem.grade}</p>
                      <p className="text-sm text-gray-600">{classItem.subject} • {classItem.students} students</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Class Average</p>
                      <p className="text-lg font-bold text-blue-600">{classItem.avgScore}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Assessments</h3>
                <Button size="sm" variant="outline">Create New</Button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {[
                  { title: 'Mathematics End Term Exam', grade: 'Grade 7A', submitted: 32, total: 35 },
                  { title: 'Science Mid-Term Test', grade: 'Grade 8A', submitted: 28, total: 32 },
                  { title: 'Weekly Math Quiz', grade: 'Grade 7B', submitted: 38, total: 38 },
                ].map((assessment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{assessment.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{assessment.grade}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {assessment.submitted}/{assessment.total}
                      </p>
                      <p className="text-xs text-gray-600">submitted</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <Button variant="primary" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Create Lesson Plan
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Create Assessment
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Grade Assignments
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Update Timetable
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {[
                  { time: '08:00 AM', class: 'Grade 7A', subject: 'Mathematics' },
                  { time: '10:00 AM', class: 'Grade 7B', subject: 'Mathematics' },
                  { time: '01:00 PM', class: 'Grade 8A', subject: 'Mathematics' },
                ].map((schedule, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-16 flex-shrink-0">
                      <Clock className="w-4 h-4 text-gray-400 mb-1" />
                      <p className="text-xs font-medium text-gray-700">{schedule.time}</p>
                    </div>
                    <div className="flex-1 p-2 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-sm font-medium text-gray-900">{schedule.class}</p>
                      <p className="text-xs text-gray-600">{schedule.subject}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Pending Tasks</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                {[
                  'Grade 12 assignments to mark',
                  'Submit Grade 7A report cards',
                  'Review lesson plan for next week',
                ].map((task, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1" />
                    <p className="text-sm text-gray-700">{task}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
