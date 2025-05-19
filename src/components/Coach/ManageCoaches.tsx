"use client";
import { useUser } from '@clerk/nextjs';
import React, { useEffect, useState, useCallback } from 'react'
import Loader from '../Loader';
import ErrorMessage from '../ErrorMessage';
import { useRouter } from 'next/navigation';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import { TrashIcon } from '@heroicons/react/24/solid';

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
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [coachToDelete, setCoachToDelete] = useState<Coach | null>(null);
    const [confirmationName, setConfirmationName] = useState('');

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

    // Add delete handler
    const handleDeleteClick = useCallback((e: React.MouseEvent, coach: Coach) => {
        e.stopPropagation(); // Prevent row click
        setCoachToDelete(coach);
        setDeleteModalOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (confirmationName !== coachToDelete?.firstName) {
            setError('First name does not match');
            return;
        }

        try {
            const response = await fetch(`/api/coaches/${coachToDelete._id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete coach');
            }

            // Remove coach from local state
            setCoaches(prev => prev.filter(c => c._id !== coachToDelete._id));
            setDeleteModalOpen(false);
            setCoachToDelete(null);
            setConfirmationName('');
        } catch (err: any) {
            setError(err.message);
        }
    }, [coachToDelete, confirmationName]);

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
                                    <th className="py-2 px-4 text-right">Actions</th>
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
                                        <td className="text-black py-2 px-4 text-right">
                                            <button
                                                onClick={(e) => handleDeleteClick(e, coach)}
                                                className="text-red-600 hover:text-red-800 transition-colors"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Delete Confirmation Modal */}
                        {deleteModalOpen && coachToDelete && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                                        Delete Coach
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        Are you sure you want to delete {coachToDelete.firstName} {coachToDelete.lastName}?
                                        This action cannot be undone.
                                    </p>
                                    <p className="text-gray-600 mb-4">
                                        To confirm, please type the coach&apos;s first name: <span className="font-semibold">{coachToDelete.firstName}</span>
                                    </p>
                                    <input
                                        type="text"
                                        value={confirmationName}
                                        onChange={(e) => setConfirmationName(e.target.value)}
                                        placeholder="Type first name to confirm"
                                        className="w-full p-2 border rounded mb-4 text-black"
                                    />
                                    <div className="flex justify-end space-x-4">
                                        <button
                                            onClick={() => {
                                                setDeleteModalOpen(false);
                                                setCoachToDelete(null);
                                                setConfirmationName('');
                                            }}
                                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDeleteConfirm}
                                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                            disabled={confirmationName !== coachToDelete.firstName}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

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