"use client";

import ResetPasswordForm from "../../components/forget-password/ResetPasswordForm";


export default function ResetPasswordPage() {
  return (
    <div>
        <div className="min-h-screen flex flex-col   py-1 px-4 sm:px-6 lg:px-8  ">
         
          <div className="sm:mx-auto sm:w-full sm:max-w-md text-center animate-fade-in-up">
            
          </div>
    
         
          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
          
            <div className="bg-white dark:bg-white py-8 px-6 sm:px-10 rounded-xl shadow-lg border border-[#fff1ad]/50 transition-all duration-300 hover:shadow-xl hover:border-[#fff1ad]/70 animate-fade-in-up animation-delay-200">
             <ResetPasswordForm />
              
            </div>
          </div>
    
        
          <div className="mt-8 text-center text-sm text-gray-300 animate-fade-in-up animation-delay-400">
            <p>
              © {new Date().getFullYear()} संज्ञा. All rights reserved.{" "}
              <a
                href="/terms"
                className="text-[#dac455] hover:text-[#e6d89c] transition-colors duration-200"
              >
                Terms
              </a>{" "}
              |{" "}
              <a
                href="/privacy"
                className="text-[#dac455] hover:text-[#e6d89c] transition-colors duration-200"
              >
                Privacy
              </a>
            </p>
          </div>
        </div>
        </div>
  )
}
