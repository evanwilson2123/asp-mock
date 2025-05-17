"use client";
import { ICoach } from '@/models/coach';
import { useUser } from '@clerk/nextjs';
import { useParams, useRouter, usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import Loader from '../Loader';
import ErrorMessage from '../ErrorMessage';
import Image from 'next/image';
import { CameraIcon } from '@heroicons/react/24/outline';
import { TrashIcon } from '@heroicons/react/24/solid';

interface Group {
    _id: string;
    name: string;
    level: string;
}

interface CoachNote {
    _id?: string;
    coachName: string;
    coachNote: string;
    date: Date;
}

interface CoachWithPhoto extends ICoach {
    photoUrl?: string;
}

const CoachPage = () => {
    const [coach, setCoach] = useState<CoachWithPhoto | null>(null);
    const [groups, setGroups] = useState<Group[]>([]);
    const [coachNotes, setCoachNotes] = useState<CoachNote[]>([]);
    const [newNoteText, setNewNoteText] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const { coachId } = useParams();
    const { user } = useUser();
    const role = user?.publicMetadata.role as string | undefined;
    const router = useRouter();
    const pathname = usePathname();

    // Navigation items for the coach page
    const navItems = [
        { name: 'Profile', path: `/coach/${coachId}` },
        { name: 'Teams', path: `/coach/${coachId}/teams` },
        { name: 'Schedule', path: `/coach/${coachId}/schedule` },
        { name: 'Reports', path: `/coach/${coachId}/reports` },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/coaches/${coachId}`);
                if (!response.ok) {
                    setError('Failed to fetch coach');
                    return;
                }
                const data = await response.json();
                setCoach(data.coach);
                setGroups(data.groups || []);
                setCoachNotes(data.coach?.notes || []);
            } catch (error: any) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [coachId]);

    // Handle saving new notes
    const handleNotesSave = async () => {
        const newNote: CoachNote = {
            coachName: `${user?.publicMetadata?.firstName || 'Admin'} ${user?.publicMetadata?.lastName || ''}`.trim(),
            coachNote: newNoteText,
            date: new Date(),
        };

        try {
            const response = await fetch(`/api/coaches/${coachId}/notes`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note: newNote }),
            });
            if (!response.ok) {
                throw new Error('Failed to save note');
            }
            setCoachNotes((prevNotes) => [...prevNotes, newNote]);
            setNewNoteText('');
            setUploadStatus('Note saved successfully');
        } catch (error) {
            console.error('Error saving note:', error);
            setUploadStatus('Failed to save note');
        } finally {
            setTimeout(() => setUploadStatus(null), 3000);
        }
    };

    // Handle deleting notes
    const handleDeleteNote = async (noteId: string) => {
        try {
            const response = await fetch(
                `/api/coaches/${coachId}/notes?noteId=${noteId}`,
                { method: 'DELETE' }
            );
            if (!response.ok) {
                throw new Error('Failed to delete note');
            }
            setCoachNotes((prevNotes) =>
                prevNotes.filter((note) => note._id?.toString() !== noteId)
            );
            setUploadStatus('Note deleted successfully');
        } catch (error: any) {
            console.error(error);
            setUploadStatus('Failed to delete note');
        } finally {
            setTimeout(() => setUploadStatus(null), 3000);
        }
    };

    // Handle photo upload
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingPhoto(true);
        const formData = new FormData();
        formData.append('photo', file);

        try {
            const response = await fetch(`/api/coaches/${coachId}/uploadPhoto`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Photo upload failed');
            }

            const data = await response.json();
            setCoach((prev) =>
                prev ? { ...prev, photoUrl: data.profilePhotoUrl } : prev
            );
        } catch (error: any) {
            console.error('Error uploading photo:', error);
        } finally {
            setUploadingPhoto(false);
        }
    };

    if (loading) return <Loader />;
    if (error) return <ErrorMessage message={error} role={role} />;

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <div className="md:hidden bg-gray-100">
                {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
            </div>
            <div className="hidden md:block w-64 bg-gray-900 text-white">
                {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-6 bg-gray-100 flex-col overflow-x-hidden">
                {/* Navigation Bar */}
                <nav className="bg-white rounded-lg shadow-md mb-6 p-3 flex space-x-4 sticky top-0 z-10">
                    {navItems.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => router.push(item.path)}
                            className={`text-gray-700 font-semibold hover:text-gray-900 transition ${
                                pathname === item.path ? 'underline' : ''
                            }`}
                        >
                            {item.name}
                        </button>
                    ))}
                </nav>

                {/* Profile Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        {/* Profile Info */}
                        <div className="flex items-center space-x-6">
                            <div className="relative w-36 h-36 bg-gray-200 overflow-hidden rounded-lg">
                                {coach?.photoUrl ? (
                                    <Image
                                        src={coach.photoUrl}
                                        alt={`${coach.firstName} ${coach.lastName}`}
                                        width={144}
                                        height={144}
                                        className="w-full h-full object-cover rounded-lg"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        No Photo
                                    </div>
                                )}
                                {/* Photo upload overlay */}
                                {role === 'ADMIN' && (
                                    <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                                        <CameraIcon className="h-8 w-8 text-white" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                                {uploadingPhoto && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                                        Uploading...
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-700">
                                    {coach?.firstName} {coach?.lastName}
                                </p>
                                <p className="text-sm text-gray-500">Email: {coach?.email}</p>
                                <p className="text-sm text-gray-500">
                                    Groups: {groups.length || 'No teams assigned'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Teams Section */}
                {groups.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-bold text-gray-700 mb-4">Groups</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groups.map((group) => (
                                <div
                                    key={group._id}
                                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => router.push(`/my-team/${group._id}`)}
                                >
                                    <h3 className="font-semibold text-gray-800">{group.name}</h3>
                                    <p className="text-sm text-gray-600">Level: {group.level}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-700 mb-4">Notes</h2>
                    {/* Display existing notes */}
                    <div className="mb-4">
                        {coachNotes.length > 0 ? (
                            coachNotes.map((note, index) => (
                                <div
                                    key={index}
                                    className="mb-2 p-2 border rounded flex justify-between items-start"
                                >
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            <span className="font-semibold">{note.coachName}</span> on{' '}
                                            {new Date(note.date).toLocaleDateString()}:
                                        </p>
                                        <p className="text-gray-800">{note.coachNote}</p>
                                    </div>
                                    {role === 'ADMIN' && (
                                        <button
                                            onClick={() => note._id && handleDeleteNote(note._id.toString())}
                                            className=""
                                        >
                                            <TrashIcon className="h-5 w-5 text-gray-700" />
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">No notes yet.</p>
                        )}
                    </div>

                    {/* Add new note (admin only) */}
                    {role === 'ADMIN' && (
                        <>
                            <textarea
                                value={newNoteText}
                                onChange={(e) => setNewNoteText(e.target.value)}
                                className="text-black w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={4}
                                placeholder="Add a new note..."
                            ></textarea>
                            <button
                                onClick={handleNotesSave}
                                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                            >
                                Save Note
                            </button>
                        </>
                    )}
                </div>

                {/* Upload Status */}
                {uploadStatus && (
                    <div className="mt-4 p-2 bg-green-200 text-green-800 rounded-lg">
                        {uploadStatus}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoachPage;