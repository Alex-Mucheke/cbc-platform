import { User, TrendingUp, BookOpen, Award, MessageSquare, Calendar } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export function ParentDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Parent Portal</h1>
        <p className="text-gray-600">Monitor your child's academic progress and stay connected</p>
      </div>

      <Card>
        <CardBody>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">John Kamau</h2>
              <p className="text-gray-600">Grade 7 • Admission No: 2024/001</p>
            </div>
            <div className="ml-auto">
              <Button size="sm">Switch Child</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Overall Average</p>
              <p className="text-2xl font-bold text-gray-900">85%</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Courses</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Badges</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Attendance</p>
              <p className="text-2xl font-bold text-gray-900">95%</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Subject Performance</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {[
                  { subject: 'Mathematics', score: 92, competency: 'Exceeding Expectations', trend: 'up' },
                  { subject: 'English', score: 88, competency: 'Meeting Expectations', trend: 'up' },
                  { subject: 'Science', score: 85, competency: 'Meeting Expectations', trend: 'neutral' },
                  { subject: 'Kiswahili', score: 78, competency: 'Approaching Expectations', trend: 'down' },
                  { subject: 'Social Studies', score: 82, competency: 'Meeting Expectations', trend: 'up' },
                ].map((subject) => (
                  <div key={subject.subject} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900">{subject.subject}</p>
                        <p className="text-sm text-gray-600">{subject.competency}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-blue-600">{subject.score}%</span>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            subject.trend === 'up'
                              ? 'bg-green-100 text-green-600'
                              : subject.trend === 'down'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {subject.trend === 'up' ? '↑' : subject.trend === 'down' ? '↓' : '→'}
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${subject.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {[
                  {
                    date: 'Dec 10, 2024',
                    activity: 'Completed Mathematics End Term Exam',
                    score: 92,
                    type: 'exam',
                  },
                  {
                    date: 'Dec 8, 2024',
                    activity: 'Submitted English Essay Assignment',
                    score: 88,
                    type: 'assignment',
                  },
                  {
                    date: 'Dec 6, 2024',
                    activity: 'Completed Science Chapter 5 Quiz',
                    score: 85,
                    type: 'quiz',
                  },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{item.activity}</p>
                      <p className="text-xs text-gray-600 mt-1">{item.date}</p>
                    </div>
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      {item.score}%
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
              <h3 className="text-lg font-semibold text-gray-900">Teacher Comments</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {[
                  {
                    teacher: 'Mr. Ochieng',
                    subject: 'Mathematics',
                    comment: 'Excellent problem-solving skills. Keep up the great work!',
                  },
                  {
                    teacher: 'Mrs. Wanjiru',
                    subject: 'English',
                    comment: 'Good progress in creative writing. Work on grammar.',
                  },
                ].map((item, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="font-medium text-gray-900 text-sm">{item.subject}</p>
                    <p className="text-xs text-gray-600 mb-2">{item.teacher}</p>
                    <p className="text-sm text-gray-700">{item.comment}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {[
                  { date: 'Dec 15', event: 'Mathematics End Term Exam', type: 'exam' },
                  { date: 'Dec 18', event: 'Parent-Teacher Meeting', type: 'meeting' },
                  { date: 'Dec 20', event: 'School Closing Day', type: 'holiday' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                      <p className="text-xs text-blue-600 font-medium">{item.date.split(' ')[0]}</p>
                      <p className="text-xs text-blue-600">{item.date.split(' ')[1]}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.event}</p>
                      <p className="text-xs text-gray-600 capitalize">{item.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                <Button variant="primary" className="w-full justify-start" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message Teacher
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Report Card
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Calendar
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
