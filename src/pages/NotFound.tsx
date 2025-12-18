import { Link } from "react-router-dom";
import { Video, Home, ArrowLeft } from "lucide-react";
import Button from "../components/ui/Button";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white shadow-lg rounded-md p-6 sm:p-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-md bg-blue-600/10 text-blue-700 flex items-center justify-center">
            <Video size={22} />
          </div>
          <div className="font-semibold text-gray-900">
            Video Documentation AI
          </div>
        </div>

        <div className="mb-6">
          <div className="text-6xl font-bold text-gray-900">404</div>
          <h1 className="text-xl font-semibold text-gray-900 mt-2">
            Page not found
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            The page you’re looking for doesn’t exist or was moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/">
            <Button
              variant="fill"
              size="md"
              className="w-full sm:w-auto"
              btnText="Go to Dashboard"
            >
              <Home size={18} />
            </Button>
          </Link>
          <Link to="/login">
            <Button
              variant="outline"
              size="md"
              className="w-full sm:w-auto"
              btnText="Back to Login"
            >
              <ArrowLeft size={18} />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
