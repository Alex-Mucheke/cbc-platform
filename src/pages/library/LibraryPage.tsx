import { useState } from 'react';
import { BookOpen, Download, Eye, Filter, Search } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const sampleResources = [
  {
    id: 1,
    title: 'Mathematics Grade 7 - Learner\'s Book',
    type: 'Textbook',
    subject: 'Mathematics',
    grade: 'Grade 7',
    author: 'Kenya Institute of Curriculum Development',
    publisher: 'KICD',
    cover: 'https://images.pexels.com/photos/4145190/pexels-photo-4145190.jpeg?auto=compress&cs=tinysrgb&w=400',
    pages: 240,
    downloads: 1523,
    views: 4231,
  },
  {
    id: 2,
    title: 'English Activities Book Grade 6',
    type: 'Activity Book',
    subject: 'English',
    grade: 'Grade 6',
    author: 'Kenya Institute of Curriculum Development',
    publisher: 'KICD',
    cover: 'https://images.pexels.com/photos/256395/pexels-photo-256395.jpeg?auto=compress&cs=tinysrgb&w=400',
    pages: 180,
    downloads: 2104,
    views: 5672,
  },
  {
    id: 3,
    title: 'Science and Technology Grade 5',
    type: 'Textbook',
    subject: 'Science',
    grade: 'Grade 5',
    author: 'Kenya Institute of Curriculum Development',
    publisher: 'KICD',
    cover: 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=400',
    pages: 200,
    downloads: 1892,
    views: 3847,
  },
  {
    id: 4,
    title: 'Kiswahili Kitabu cha Mwanafunzi Darasa la 8',
    type: 'Textbook',
    subject: 'Kiswahili',
    grade: 'Grade 8',
    author: 'Kenya Institute of Curriculum Development',
    publisher: 'KICD',
    cover: 'https://images.pexels.com/photos/4143791/pexels-photo-4143791.jpeg?auto=compress&cs=tinysrgb&w=400',
    pages: 220,
    downloads: 1345,
    views: 2981,
  },
  {
    id: 5,
    title: 'Social Studies Teacher\'s Guide Grade 7',
    type: 'Teacher Guide',
    subject: 'Social Studies',
    grade: 'Grade 7',
    author: 'Kenya Institute of Curriculum Development',
    publisher: 'KICD',
    cover: 'https://images.pexels.com/photos/4145153/pexels-photo-4145153.jpeg?auto=compress&cs=tinysrgb&w=400',
    pages: 160,
    downloads: 892,
    views: 1754,
  },
  {
    id: 6,
    title: 'Creative Arts Grade 6 Activity Book',
    type: 'Activity Book',
    subject: 'Creative Arts',
    grade: 'Grade 6',
    author: 'Kenya Institute of Curriculum Development',
    publisher: 'KICD',
    cover: 'https://images.pexels.com/photos/1153895/pexels-photo-1153895.jpeg?auto=compress&cs=tinysrgb&w=400',
    pages: 150,
    downloads: 1124,
    views: 2456,
  },
];

const subjects = ['All', 'Mathematics', 'English', 'Science', 'Kiswahili', 'Social Studies', 'Creative Arts'];
const grades = ['All', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
const resourceTypes = ['All', 'Textbook', 'Activity Book', 'Teacher Guide', 'Reader'];

export function LibraryPage() {
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResources = sampleResources.filter((resource) => {
    const matchesSubject = selectedSubject === 'All' || resource.subject === selectedSubject;
    const matchesGrade = selectedGrade === 'All' || resource.grade === selectedGrade;
    const matchesType = selectedType === 'All' || resource.type === selectedType;
    const matchesSearch =
      searchQuery === '' ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.subject.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSubject && matchesGrade && matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Digital Library</h1>
        <p className="text-gray-600">Access CBC-aligned textbooks, activity books, and learning resources</p>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                placeholder="Search by title, subject, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              >
                {grades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>

              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              >
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              >
                {resourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing <span className="font-semibold">{filteredResources.length}</span> resources
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => (
          <Card key={resource.id} hover>
            <div className="aspect-[3/4] overflow-hidden bg-gray-100">
              <img
                src={resource.cover}
                alt={resource.title}
                className="w-full h-full object-cover"
              />
            </div>
            <CardBody>
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {resource.type}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                    {resource.grade}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{resource.title}</h3>
                <p className="text-sm text-gray-600">{resource.subject}</p>
                <p className="text-xs text-gray-500 mt-1">{resource.author}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {resource.views.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {resource.downloads.toLocaleString()}
                </span>
                <span>{resource.pages} pages</span>
              </div>

              <div className="flex gap-2">
                <Button variant="primary" className="flex-1" size="sm">
                  <BookOpen className="w-4 h-4 mr-1" />
                  Read
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
