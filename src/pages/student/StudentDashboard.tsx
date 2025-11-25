import { Award, BookOpen, TrendingUp, Clock, Target, Zap } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';

export function StudentDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Student!</h1>
        <p className="text-gray-600">Track your progress and continue your learning journey</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Courses in Progress</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">87%</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total XP</p>
              <p className="text-2xl font-bold text-gray-900">2,450</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Badges Earned</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Current Learning Streak</h3>
            </CardHeader>
            <CardBody>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-4xl font-bold text-blue-600">7 Days</p>
                  <p className="text-sm text-gray-600 mt-1">Keep it up! You're doing great</p>
                </div>
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                  <Clock className="w-10 h-10 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                  <div key={day} className="text-center">
                    <div
                      className={`w-full h-12 rounded-lg mb-1 flex items-center justify-center ${
                        index < 5
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {index < 5 ? '✓' : ''}
                    </div>
                    <p className="text-xs text-gray-600">{day}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {[
                  {
                    subject: 'Mathematics',
                    activity: 'Completed Chapter 5 Assessment',
                    score: 92,
                    time: '2 hours ago',
                  },
                  {
                    subject: 'English',
                    activity: 'Read "The River Between"',
                    score: null,
                    time: '5 hours ago',
                  },
                  {
                    subject: 'Science',
                    activity: 'Watched: States of Matter',
                    score: null,
                    time: 'Yesterday',
                  },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.activity}</p>
                      <p className="text-sm text-gray-600">{item.subject} • {item.time}</p>
                    </div>
                    {item.score && (
                      <div className="ml-4 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        {item.score}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Subject Performance</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {[
                  { subject: 'Mathematics', score: 92, color: 'blue' },
                  { subject: 'English', score: 88, color: 'green' },
                  { subject: 'Science', score: 85, color: 'purple' },
                  { subject: 'Kiswahili', score: 78, color: 'orange' },
                ].map((item) => (
                  <div key={item.subject}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.subject}</span>
                      <span className="text-sm font-bold text-gray-900">{item.score}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`bg-${item.color}-600 h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${item.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Assessments</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {[
                  { subject: 'Mathematics', title: 'End Term Exam', date: 'Dec 15' },
                  { subject: 'English', title: 'Essay Writing', date: 'Dec 18' },
                  { subject: 'Science', title: 'Lab Practical', date: 'Dec 20' },
                ].map((item, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-600">{item.subject}</span>
                      <span className="text-xs font-medium text-blue-600">{item.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Learning Goals</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Complete 10 lessons</p>
                    <p className="text-xs text-gray-600">7 of 10 completed</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Award className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Earn 5 new badges</p>
                    <p className="text-xs text-gray-600">3 of 5 earned</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">14-day streak</p>
                    <p className="text-xs text-gray-600">7 of 14 days</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
