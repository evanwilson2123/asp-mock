"use client";
import { useUser } from '@clerk/nextjs';
import React, { useEffect, useState, useCallback } from 'react'
import Loader from '../Loader';
import ErrorMessage from '../ErrorMessage';
import { useRouter } from 'next/navigation';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';

interface Coach {
    firstName: string;
    lastName: string;
    email: string;
    _id: string;
}

const ManageCoaches = () => {
    const router = useRouter();
    const { user } = useUser();
    const role = user?.publicMetadata.role as string | undefined;

    // state for loading and error
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [coaches, setCoaches] = useState<Coach[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    const fetchData = useCallback(async () => {
        try {
            const response = await fetch('/api/coaches');
            if (!response.ok) {
                setError('Failed to fetch coaches');
                return;
            }
            const data = await response.json();
            setCoaches(data.coaches);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (role === 'ATHLETE') {
            router.push('/');
            return;
        }
        fetchData();
    }, [role, router, fetchData]);

    // Filter logic
    const filteredCoaches = coaches.filter((coach) => {
        const fullName = (coach.firstName + ' ' + coach.lastName).toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredCoaches.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedCoaches = filteredCoaches.slice(startIndex, endIndex);

    // Table row click handler
    const handleCoachClick = useCallback((coachId: string) => {
        router.push(`/coach/${coachId}`);
    }, [router]);

    // Pagination navigation
    const handlePrevious = useCallback(() => {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        }
    }, [currentPage]);

    const handleNext = useCallback(() => {
        if (currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
        }
    }, [currentPage, totalPages]);

    // Build numeric page links
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    if (loading) return <Loader />;
    if (error) return <ErrorMessage message={error} role={role} />;
    if (role !== 'ADMIN') {
        return <div>You are not authorized to access this page</div>;
    }

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <div className="md:hidden bg-gray-100">
                {(role as string) === 'COACH' ? <CoachSidebar /> : <Sidebar />}
            </div>
            <div className="hidden md:block w-64 bg-gray-900 text-white">
                {(role as string) === 'COACH' ? <CoachSidebar /> : <Sidebar />}
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 bg-gray-100">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-700">Manage Coaches</h1>
                </div>

                {/* Filter Section */}
                <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                    <div className="flex-1">
                        <label
                            htmlFor="search"
                            className="block text-gray-700 font-semibold mb-1"
                        >
                            Search by Name:
                        </label>
                        <input
                            id="search"
                            type="text"
                            placeholder="e.g. John"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full p-2 border rounded text-black"
                        />
                    </div>
                </div>

                {/* Coaches Table */}
                {paginatedCoaches.length > 0 ? (
                    <>
                        <table className="min-w-full bg-white rounded-lg shadow-md">
                            <thead>
                                <tr className="bg-gray-200 text-gray-700">
                                    <th className="py-2 px-4 text-left">First Name</th>
                                    <th className="py-2 px-4 text-left">Last Name</th>
                                    <th className="py-2 px-4 text-left">Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedCoaches.map((coach) => (
                                    <tr
                                        key={coach._id}
                                        onClick={() => handleCoachClick(coach._id)}
                                        className="hover:bg-blue-50 cursor-pointer"
                                    >
                                        <td className="text-black py-2 px-4">
                                            {coach.firstName}
                                        </td>
                                        <td className="text-black py-2 px-4">{coach.lastName}</td>
                                        <td className="text-black py-2 px-4">{coach.email}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Controls */}
                        <div className="mt-4 flex items-center justify-center space-x-4">
                            {/* Previous Button */}
                            <button
                                onClick={handlePrevious}
                                disabled={currentPage <= 1}
                                className="text-black px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                            >
                                Previous
                            </button>

                            {/* Numeric Page Links */}
                            <div className="space-x-2">
                                {pages.map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-1 rounded ${
                                            page === currentPage
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 hover:bg-gray-300 text-black'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>

                            {/* Next Button */}
                            <button
                                onClick={handleNext}
                                disabled={currentPage >= totalPages}
                                className="text-black px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </>
                ) : (
                    <p className="text-lg text-blue-900 text-center mt-4">
                        No coaches found matching your search.
                    </p>
                )}
            </div>
        </div>
    );
}

export default ManageCoaches