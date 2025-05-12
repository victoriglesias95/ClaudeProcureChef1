import { useState, FormEvent } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { setupDatabase, createTestUser } from '../utils/databaseSetup';
import { checkDatabaseConnection } from '../services/supabase';
import { toast } from 'sonner';

const Admin = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'chef' | 'purchasing' | 'admin'>('admin');
  const [connectionStatus, setConnectionStatus] = useState<{ connected: boolean, message: string }>({ 
    connected: false, 
    message: 'Not checked' 
  });
  
  const handleSetupDatabase = async () => {
    setLoading(true);
    try {
      const result = await setupDatabase();
      if (result.success) {
        toast.success('Database setup completed successfully');
      } else {
        toast.error('Database setup failed');
        console.error(result.error);
      }
    } catch (error) {
      toast.error('Database setup failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createTestUser(email, password, role);
      if (result.success) {
        toast.success(`User ${email} created successfully with role: ${role}`);
        setEmail('');
        setPassword('');
      } else {
        toast.error('Failed to create user');
        console.error(result.error);
      }
    } catch (error) {
      toast.error('Failed to create user');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCheckConnection = async () => {
    setLoading(true);
    try {
      const result = await checkDatabaseConnection();
      if (result.connected) {
        setConnectionStatus({
          connected: true,
          message: 'Connected successfully to Supabase!'
        });
        toast.success('Database connected!');
      } else {
        setConnectionStatus({
          connected: false,
          message: 'Failed to connect to database'
        });
        toast.error('Database connection failed');
      }
    } catch (error) {
      setConnectionStatus({
        connected: false,
        message: 'Error checking connection'
      });
      toast.error('Error checking database connection');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Tools</h1>
          <p className="text-gray-600">Database and system management</p>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Database Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-4">
              <div className={`w-4 h-4 rounded-full mr-2 ${connectionStatus.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p className="font-medium">Status: {connectionStatus.message}</p>
            </div>
            <Button 
              onClick={handleCheckConnection} 
              isLoading={loading}
              variant="primary"
            >
              Check Connection
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Database Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Initialize Database</h3>
            <p className="text-sm text-gray-600 mb-4">
              Populate the database with initial suppliers, products, and inventory.
              This is useful for getting started.
            </p>
            <Button 
              onClick={handleSetupDatabase} 
              isLoading={loading}
              variant="primary"
            >
              Setup Database
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create Test User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'chef' | 'purchasing' | 'admin')}
                  className="w-full p-2 border rounded"
                >
                  <option value="chef">Chef</option>
                  <option value="purchasing">Purchasing</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <Button 
              type="submit"
              isLoading={loading}
              variant="primary"
            >
              Create User
            </Button>
          </form>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default Admin;