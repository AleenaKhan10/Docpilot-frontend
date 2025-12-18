import { Mail, Lock, LogIn, Video } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useSignIn } from "@clerk/clerk-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  // CLERK
  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();

  // STATED

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // METHODS
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate("/"); // redirect after login
      } else {
        console.log("Additional steps required:", result);
      }
    } catch (err: any) {
      console.log(err);
      const clerkError =
        err?.errors?.[0]?.long_message || "Invalid email or password";
      setError(clerkError);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-md p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-md bg-blue-600/10 text-blue-700 flex items-center justify-center">
            <Video size={22} />
          </div>
          <div className="font-semibold text-gray-900">
            Video Documentation AI
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Welcome Back</h1>
          <p className="text-sm text-gray-600 mt-1">
            Login to access your AI-generated documentation dashboard
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="Enter email address"
            variant="filled"
            inputSize="md"
            leftIcon={<Mail size={18} />}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter password"
            variant="filled"
            inputSize="md"
            leftIcon={<Lock size={18} />}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
          />

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Remember me
            </label>
            <Link
              to="/forgot-password"
              className="text-sm text-blue-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="md"
            variant="fill"
            btnText="Login"
          >
            <LogIn size={18} />
          </Button>

          <div className="text-sm text-center text-gray-700">
            Don’t have an account?{" "}
            <Link to="/register" className="text-blue-700 hover:underline">
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
