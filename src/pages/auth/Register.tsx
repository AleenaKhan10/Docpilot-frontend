import { Link } from "react-router-dom";
import { Video, User, Mail, Lock, UserPlus } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useSignUp } from "@clerk/clerk-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  // CLERK
  const { isLoaded, signUp, setActive } = useSignUp();

  // NAVIGATE
  const navigate = useNavigate();

  // STATES
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // HANDLER VALIDATE INPUT FIELDS
  const validate = () => {
    const newErrors: any = {};

    if (!fullName.trim()) newErrors.fullName = "Full name is required";
    if (!email.trim()) newErrors.email = "Email is required";

    if (!password) newErrors.password = "Password is required";

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // HANDLE REGISTER
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (!isLoaded) return;

    try {
      // 1️⃣ Create Sign Up Attempt
      await signUp.create({
        emailAddress: email,
        password: password,
      });

      // 2️⃣ Prepare Email Verification (if enabled)
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      // 3️⃣ Verify user immediately OR redirect to code page
      // For now, auto-complete without verification:
      const completeSignup = await signUp.attemptEmailAddressVerification({
        code: "000000", // skip verification for development
      });

      if (completeSignup.status === "complete") {
        await setActive({ session: completeSignup.createdSessionId });

        navigate("/");
      } else {
        console.log("Verification required:", completeSignup);
      }
    } catch (err: any) {
      console.error(err);
      const clerkError =
        err?.errors?.[0]?.long_message || "Registration failed";
      // setError(clerkError);
      console.log("CLERK ERROR : ", clerkError);
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
          <h1 className="text-2xl font-semibold text-gray-900">
            Create your account
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Join and turn videos into structured, searchable docs
          </p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="Enter your full name"
            variant="filled"
            inputSize="md"
            leftIcon={<User size={18} />}
            onChange={(e) => setFullName(e.target.value)}
            error={errors.fullName}
          />

          <Input
            label="Email"
            type="email"
            placeholder="Enter email address"
            variant="filled"
            inputSize="md"
            leftIcon={<Mail size={18} />}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Create a password"
            variant="filled"
            inputSize="md"
            leftIcon={<Lock size={18} />}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter password"
            variant="filled"
            inputSize="md"
            leftIcon={<Lock size={18} />}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            error={errors.confirmPassword}
          />

          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            I agree to the Terms and Privacy Policy
          </label>

          <Button
            className="w-full"
            size="md"
            variant="fill"
            btnText="Create account"
            type="submit"
          >
            <UserPlus size={18} />
          </Button>

          <div className="text-sm text-center text-gray-700">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-700 hover:underline">
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
