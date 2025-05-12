import { useState, FormEvent } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { setupDatabase, createTestUser } from '../utils/databaseSetup';
import { checkDatabaseConnection, supabase } from '../services/supabase';
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
  const [userCheckEmail, setUserCheckEmail] = useState('test@procurechef.com');
  const [userDetails, setUserDetails] = useState<any>(null);
  
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

  const checkUserExists = async () => {
    if (!userCheckEmail) {
      toast.error('Please enter an email address');
      return;
    }
    
    setLoading(true);
    setUserDetails(null);
    
    try {
      // Check in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', userCheckEmail);
      
      if (userError) {
        toast.error('Error checking user in database: ' + userError.message);
        console.error(userError);
        return;
      }
      
      // Check current session
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;
      
      // Display results
      if (userData && userData.length > 0) {
        const dbUser = userData[0];
        setUserDetails({
          dbUser,
          currentSession: currentUser?.email === userCheckEmail ? currentUser : null
        });
        
        if (currentUser?.email === userCheckEmail) {
          toast.success('User found in database and is currently logged in');
        } else {
          toast.success('User found in database (not currently logged in)');
        }
      } else {
        if (currentUser?.email === userCheckEmail) {
          toast.warning('User is logged in but NOT in users table');
          setUserDetails({
            dbUser: null,
            currentSession: currentUser
          });
        } else {
          toast.error('User not found in database');
          setUserDetails({
            dbUser: null,
            currentSession: null
          });
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
      toast.error('Error checking user');
    } finally {
      setLoading(false);
    }
  };

  const createMissingUserRecord = async () => {
    if (!userDetails?.currentSession || userDetails?.dbUser) {
      toast.error('Cannot create user record - either already exists or no current user');
      return;
    }
    
    setLoading(true);
    
    try {
      const currentUser = userDetails.currentSession;
      
      const { error } = await supabase
        .from('users')
        .insert({
          id: currentUser.id,
          email: currentUser.email,
          role: 'admin', // Default role
          name: 'Admin User'
        });
      
      if (error) {
        toast.error('Failed to create user record: ' + error.message);
        console.error(error);
      } else {
        toast.success('User record created successfully');
        // Refresh user details
        await checkUserExists();
      }
    } catch (error) {
      console.error('Error creating user record:', error);
      toast.error('Error creating user record');
    } finally {
      setLoading(false);
    }
  };

  const checkAuthSession = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        toast.error('Failed to get session: ' + error.message);
      } else if (data.session) {
        toast.success('Active session found');
        console.log('Session data:', data.session);
        setUserDetails({
          ...userDetails,
          currentSession: data.session.user
        });
      } else {
        toast.info('No active session found');
      }
    } catch (error) {
      console.error('Error checking session:', error);
      toast.error('Error checking session');
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

      {/* User verification card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>User Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Check User Existence</h3>
            <p className="text-sm text-gray-600 mb-4">
              Verify if a user exists in the users table and check current session.
              This can help diagnose login issues.
            </p>
            
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email to Check</label>
                <input
                  type="email"
                  value={userCheckEmail}
                  onChange={(e) => setUserCheckEmail(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={checkUserExists} 
                isLoading={loading}
                variant="primary"
              >
                Check User
              </Button>
              
              <Button 
                onClick={checkAuthSession} 
                isLoading={loading}
                variant="outline"
              >
                Check Session
              </Button>
            </div>
            
            {userDetails && (
              <div className="mt-4 border p-4 rounded-lg">
                <h4 className="font-medium mb-2">User Details:</h4>
                
                <div className="mb-3">
                  <p className="text-sm font-medium">Session Status:</p>
                  <p className="text-sm">
                    {userDetails.currentSession ? (
                      <span className="text-green-600">✓ User has an active session</span>
                    ) : (
                      <span className="text-yellow-600">⚠ No active session for this user</span>
                    )}
                  </p>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm font-medium">Database Status:</p>
                  <p className="text-sm">
                    {userDetails.dbUser ? (
                      <span className="text-green-600">✓ User exists in users table</span>
                    ) : (
                      <span className="text-red-600">✗ User NOT found in users table</span>
                    )}
                  </p>
                </div>
                
                {userDetails.currentSession && !userDetails.dbUser && (
                  <div className="mt-3">
                    <Button 
                      onClick={createMissingUserRecord} 
                      isLoading={loading}
                      variant="primary"
                      size="sm"
                    >
                      Create Missing User Record
                    </Button>
                    <p className="text-xs text-red-600 mt-1">
                      User is authenticated but missing from the users table. This will cause login issues.
                    </p>
                  </div>
                )}
                
                {userDetails.dbUser && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Database User Details:</p>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto mt-1">
                      {JSON.stringify(userDetails.dbUser, null, 2)}
                    </pre>
                  </div>
                )}
                
                {userDetails.currentSession && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Current Session User:</p>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto mt-1">
                      {JSON.stringify(userDetails.currentSession, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default Admin;