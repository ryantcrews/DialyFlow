import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Patient Management',
      description: 'Add, edit, and manage patient records',
      path: '/admin/patients',
      icon: '👥',
    },
    {
      title: 'User Management',
      description: 'Manage system users and permissions',
      path: '/admin/users',
      icon: '🔐',
    },
    {
      title: 'Export Data',
      description: 'Export visit and billing data',
      path: '/admin/export',
      icon: '📊',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary-600">
              DialyFlow Admin Dashboard
            </h1>
            <button onClick={() => navigate('/')} className="btn btn-secondary">
              Back to App
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">Administration</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="card hover:shadow-xl transition-all cursor-pointer text-left"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
