import LoginForm from '@/components/auth/LoginForm'
import Logo from '@/components/ui/logo'

export default function LoginPage() {
  return (
    <section className='flex flex-row '>
      <section className='hidden lg:flex w-1/2 h-[100vh] bg-[#d9ebff]'>
        <div className='absolute left-8 top-8'>
          <Logo/>   
        </div>
        <div className='absolute left-8 bottom-8 text-sm'>
        &quot;Connect me has helped me explore new math topics and learn critical problem solving skills.
          <br/> It makes learning so much fun&quot;
          <br/>
          --Olivia M.
          </div>
      </section>
      <section className='w-full lg:w-1/2 flex flex-col items-center '>
        <div className="container h-full mx-auto max-w-lg p-10 flex flex-col items-center justify-center align-center">
          <div className='p-8 flex flex-col items-center justify-center gap-4 border border-gray-300 rounded-xl'>
            <div className='flex flex-col gap-3'>
              <h1 className="text-2xl text-center font-bold">Log in to Connect Me</h1>
              <p className='text-sm text-gray-600'>Enter your email and password below to log in.</p>
            </div>
            <LoginForm />
          </div>
        </div>
      </section>
    </section>
  )
}