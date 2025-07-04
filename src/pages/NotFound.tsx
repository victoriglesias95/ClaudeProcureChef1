import { Link } from 'react-router-dom';

const NotFound = (): JSX.Element => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="mb-6">The page you are looking for does not exist.</p>
      <Link to="/" className="text-[#7D2027] hover:underline">
        Go back to home
      </Link>
    </div>
  );
};

export default NotFound;