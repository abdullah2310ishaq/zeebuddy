import Link from 'next/link';
import { AuthLayout } from '@/components/AuthLayout';

const SignUpPage = () => {
  return (
    <AuthLayout
      title="Authentication Disabled"
      subtitle="You can access the dashboard directly."
    >
      <div className="max-w-md m-auto flex flex-col justify-center h-full text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Auth Disabled</h2>
        <p className="mb-6">Authentication has been disabled for this deployment.</p>
        <Link
          href="/dashboard"
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          Go to Dashboard
        </Link>
      </div>
    </AuthLayout>
  );
};

export default SignUpPage;