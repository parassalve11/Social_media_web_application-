"use client";


import { useQuery } from '@tanstack/react-query'
import axiosInstance from '../lib/axiosIntance'
import Post from '../components/posts/Post' 
import { Users } from 'lucide-react'

export default function BookmarkPage() {

  const{data:bookmarkPosts , isLoading} = useQuery({
    queryKey:['bookmark'],
    queryFn:async() => {
        const res =  await axiosInstance.get('/posts/bookmarks');
        return res.data;
    }
  })
  
  
  return (
    
         <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Bookmark Page</h1>

          {isLoading && (
            <div className="flex justify-center items-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600 text-sm sm:text-base">Loading Bookmarks...</span>
            </div>
          )}
        {bookmarkPosts?.map(bookmarkPost => (<Post key={bookmarkPost._id} post={bookmarkPost} />))}
        {bookmarkPosts?.length ===0 && (
          <div className='bg-white shadow p-8 rounded-2xl text-center'>
            <div className='mb-6'>
              <Users size={64} className='text-primary mx-auto' />
            </div>
            <h2 className='text-2xl font-bold text-gray-800'>No Posts Yet</h2>
            <p className='text-gray-600  '>Connect with other users to get Posts </p>
          </div>
        )} 
    </div>

  )
}
