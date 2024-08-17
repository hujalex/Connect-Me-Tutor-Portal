import LoginForm from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <div className="container mx-auto max-w-md py-[20vh]">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      <LoginForm />
    </div>
  )
}