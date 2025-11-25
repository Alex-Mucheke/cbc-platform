import { useState } from 'react';
import { FileText, Clock, Trophy, TrendingUp, Play, CheckCircle } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const assessments = [
  {
    id: 1,
    title: 'Mathematics End Term 3 Exam 2024',
    subject: 'Mathematics',
    grade: 'Grade 7',
    type: 'Exam',
    difficulty: 'Intermediate',
    totalMarks: 100,
    duration: 120,
    questions: 40,
    attempts: 234,
    averageScore: 78,
    status: 'available',
  },
  {
    id: 2,
    title: 'English Grammar Quick Quiz',
    subject: 'English',
    grade: 'Grade 6',
    type: 'Quiz',
    difficulty: 'Basic',
    totalMarks: 30,
    duration: 20,
    questions: 15,
    attempts: 567,
    averageScore: 82,
    status: 'completed',
    myScore: 27,
  },
  {
    id: 3,
    title: 'Science Mid-Term Assessment',
    subject: 'Science',
    grade: 'Grade 7',
    type: 'Exam',
    difficulty: 'Advanced',
    totalMarks: 80,
    duration: 90,
    questions: 35,
    attempts: 189,
    averageScore: 72,
    status: 'in_progress',
  },
  {
    id: 4,
    title: 'Kiswahili Sarufi na Utungaji',
    subject: 'Kiswahili',
    grade: 'Grade 8',
    type: 'Assignment',
    difficulty: 'Intermediate',
    totalMarks: 50,
    duration: 60,
    questions: 20,
    attempts: 145,
    averageScore: 75,
    status: 'available',
  },
];

const difficultyColors = {
  Basic: 'bg-green-100 text-green-700 border-green-200',
  Intermediate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Advanced: 'bg-red-100 text-red-700 border-red-200',
};

export function ExamCenterPage() {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredAssessments = assessments.filter((assessment) => {
    if (selectedFilter === 'all') return true;
    return assessment.status === selectedFilter;
  });

  const getStatusBadge = (status: string, score?: number) => {
    switch (status) {
      case 'completed':
        return (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              Completed
            </span>
            {score && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                Score: {score}
              </span>
            )}
          </div>
        );
      case 'in_progress':
        return (
          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
            In Progress
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            Not Started
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam Center</h1>
        <p className="text-gray-600">Practice with past papers, quizzes, and assessments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Assessments</p>
              <p className="text-2xl font-bold text-gray-900">42</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">28</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">84%</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody>
          <div className="flex gap-2">
            {[
              { label: 'All', value: 'all' },
              { label: 'Available', value: 'available' },
              { label: 'In Progress', value: 'in_progress' },
              { label: 'Completed', value: 'completed' },
            ].map((filter) => (
              <Button
                key={filter.value}
                variant={selectedFilter === filter.value ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAssessments.map((assessment) => (
          <Card key={assessment.id} hover>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{assessment.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      {assessment.subject}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                      {assessment.grade}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                      {assessment.type}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${difficultyColors[assessment.difficulty as keyof typeof difficultyColors]}`}>
                      {assessment.difficulty}
                    </span>
                  </div>
                </div>
                {getStatusBadge(assessment.status, assessment.myScore)}
              </div>
            </CardHeader>

            <CardBody>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{assessment.questions} questions</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{assessment.duration} minutes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Trophy className="w-4 h-4" />
                  <span>{assessment.totalMarks} marks</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>Avg: {assessment.averageScore}%</span>
                </div>
              </div>

              <div className="flex gap-2">
                {assessment.status === 'completed' ? (
                  <>
                    <Button variant="outline" className="flex-1" size="sm">
                      View Results
                    </Button>
                    <Button variant="primary" size="sm">
                      Retake
                    </Button>
                  </>
                ) : assessment.status === 'in_progress' ? (
                  <Button variant="primary" className="flex-1" size="sm">
                    <Play className="w-4 h-4 mr-1" />
                    Continue
                  </Button>
                ) : (
                  <Button variant="primary" className="flex-1" size="sm">
                    <Play className="w-4 h-4 mr-1" />
                    Start Assessment
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
