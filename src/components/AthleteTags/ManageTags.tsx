'use client';
import React, { useEffect, useState } from 'react';
import { IAthleteTag } from '@/models/athleteTag';
import Loader from '../Loader';
import ErrorMessage from '../ErrorMessage';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import { TrashIcon } from '@heroicons/react/24/solid';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface DeletePopupState {
  show: boolean;
  tagId: string;
  confirmText: string;
}

export interface TagFolder {
  _id: string;
  name: string;
  // Folders return an array of tag IDs (strings).
  tags: string[];
}

export const ItemTypes = {
  TAG: 'tag',
};

//
// DraggableTag Component
//
interface DraggableTagProps {
  tag: IAthleteTag;
  sourceFolderId?: string;
  onToggleDetails: (tagId: string) => void;
  onShowDelete: (tagId: string) => void;
  isOpen?: boolean;
}
export const DraggableTag: React.FC<DraggableTagProps> = ({
  tag,
  sourceFolderId,
  onToggleDetails,
  onShowDelete,
  isOpen,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.TAG,
    item: { id: tag._id.toString(), sourceFolderId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  return (
    <div
      ref={drag as any}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="bg-white rounded-lg shadow-md p-4 mb-4"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-700">{tag.name}</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => onToggleDetails(tag._id.toString())}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            {isOpen ? '▲' : '▼'}
          </button>
          <button
            onClick={() => onShowDelete(tag._id.toString())}
            className="text-red-500 hover:text-red-700 transition"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="mt-4 text-gray-600">
          {tag.description && (
            <p>
              <strong>Description:</strong> {tag.description}
            </p>
          )}
          <p>
            <strong>Notes:</strong> {tag.notes}
          </p>
          {tag.links && tag.links.length > 0 && (
            <div className="mt-2">
              <strong>Links:</strong>
              <ul className="list-disc list-inside">
                {tag.links.map((link, i) => (
                  <li key={i}>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

//
// FolderItem Component
//
interface FolderItemProps {
  folder: TagFolder;
  tags: IAthleteTag[];
  openFolder: boolean;
  onToggleFolder: (folderId: string) => void;
  onDropTag: (tagId: string, destinationFolderId: string) => void;
  onToggleDetails: (tagId: string) => void;
  onShowDelete: (tagId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  openTagId: string | null;
}
export const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  tags,
  openFolder,
  onToggleFolder,
  onDropTag,
  onToggleDetails,
  onShowDelete,
  onDeleteFolder,
  openTagId,
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.TAG,
    drop: (item: { id: string; sourceFolderId?: string }) => {
      onDropTag(item.id, folder._id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });
  return (
    <div
      ref={drop as any}
      className="mb-6 border rounded-lg"
      style={isOver ? { backgroundColor: '#f0f0f0' } : {}}
    >
      <div className="rounded-md shadow-md flex justify-between items-center bg-white p-4 cursor-pointer">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold text-gray-700">{folder.name}</h2>
          <button
            onClick={() => onDeleteFolder(folder._id)}
            className="text-red-500 hover:text-red-700"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
        <span
          className="text-lg text-gray-500"
          onClick={() => onToggleFolder(folder._id)}
        >
          {openFolder ? '▲' : '▼'}
        </span>
      </div>
      {openFolder && (
        <div className="p-4">
          {folder.tags.length > 0 ? (
            folder.tags.map((tagId) => {
              const tag = tags.find(
                (t) => t._id.toString() === tagId.toString()
              );
              if (!tag) return null;
              return (
                <DraggableTag
                  key={tag._id.toString()}
                  tag={tag}
                  sourceFolderId={folder._id}
                  onToggleDetails={onToggleDetails}
                  onShowDelete={onShowDelete}
                  isOpen={openTagId === tag._id.toString()}
                />
              );
            })
          ) : (
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-gray-500">No tags in this folder.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

//
// OtherTagsContainer Component
//
interface OtherTagsContainerProps {
  children: React.ReactNode;
  onDrop: (item: { id: string; sourceFolderId?: string }) => void;
}
export const OtherTagsContainer: React.FC<OtherTagsContainerProps> = ({
  children,
  onDrop,
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.TAG,
    drop: (item: { id: string; sourceFolderId?: string }) => {
      onDrop(item);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });
  return (
    <div ref={drop as any} style={isOver ? { backgroundColor: '#f0f0f0' } : {}}>
      {children}
    </div>
  );
};

//
// Main ManageTags Component
//
const ManageTags = () => {
  const [tags, setTags] = useState<IAthleteTag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createTag, setCreateTag] = useState<boolean>(false);
  const [createFolder, setCreateFolder] = useState<boolean>(false);
  const [folderName, setFolderName] = useState<string>('');
  const [activeForm, setActiveForm] = useState<string>('Standard');
  const [folders, setFolders] = useState<TagFolder[]>([]);
  const [openFolderIds, setOpenFolderIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState<string>('');
  const [newTagDescription, setNewTagDescription] = useState<string>('');
  const [newTagNotes, setNewTagNotes] = useState<string>('');
  const [newTagLinks, setNewTagLinks] = useState<string>('');
  const [newTagTech, setNewTagTech] = useState<string>('');
  const [newTagMetric, setNewTagMetric] = useState<string>('');
  const [newTagMode, setNewTagMode] = useState<string>('Range');
  const [newTagMin, setNewTagMin] = useState<string>('');
  const [newTagMax, setNewTagMax] = useState<string>('');
  const [newTagThresholdType, setNewTagThresholdType] =
    useState<string>('Greater than');
  const [newTagThresholdValue, setNewTagThresholdValue] = useState<string>('');
  const [openTagId, setOpenTagId] = useState<string | null>(null);
  const [deletePopup, setDeletePopup] = useState<DeletePopupState>({
    show: false,
    tagId: '',
    confirmText: '',
  });

  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch('/api/tags');
        if (!res.ok) {
          setErrorMessage('Error fetching tags');
          return;
        }
        const data = await res.json();
        setTags(data.tags);
        setFolders(data.folders);
      } catch (error: any) {
        console.error(error);
        setErrorMessage('Internal Server Error');
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, []);

  const toggleTagDetails = (tagId: string) => {
    setOpenTagId((prev) => (prev === tagId ? null : tagId));
  };

  const toggleFolderDetails = (folderId: string) => {
    setOpenFolderIds((prev) =>
      prev.includes(folderId)
        ? prev.filter((id) => id !== folderId)
        : [...prev, folderId]
    );
  };

  const showDeletePopup = (tagId: string) => {
    setDeletePopup({ show: true, tagId, confirmText: '' });
  };

  const handleDeleteTag = async () => {
    try {
      const res = await fetch(`/api/tags/tag/${deletePopup.tagId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error || 'Error deleting tag');
        return;
      }
      setTags((prev) =>
        prev.filter((tag) => tag._id.toString() !== deletePopup.tagId)
      );
      setFolders((prev) =>
        prev.map((folder) => ({
          ...folder,
          tags: folder.tags.filter((id) => id.toString() !== deletePopup.tagId),
        }))
      );
      setDeletePopup({ show: false, tagId: '', confirmText: '' });
    } catch (error: any) {
      console.error(error);
      setErrorMessage('Internal Server Error');
    }
  };

  const handleCreateTag = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const tagData: any = {
      name: newTagName,
      description: newTagDescription || undefined,
      notes: newTagNotes,
      links: newTagLinks
        ? newTagLinks.split(',').map((l: string) => l.trim())
        : undefined,
      automatic: activeForm === 'Automatic',
      session: false,
    };
    if (activeForm === 'Automatic') {
      const techMapping: Record<
        string,
        'blast' | 'hittrax' | 'trackman' | 'armcare' | 'forceplates'
      > = {
        'Blast Motion': 'blast',
        Hittrax: 'hittrax',
        Trackman: 'trackman',
        Armcare: 'armcare',
        Forceplates: 'forceplates',
      };
      tagData.tech = techMapping[newTagTech] || undefined;
      tagData.metric = newTagMetric;
      if (newTagMode === 'Range') {
        tagData.min = Number(newTagMin);
        tagData.max = Number(newTagMax);
      } else if (newTagMode === 'Threshold') {
        if (newTagThresholdType === 'Greater than') {
          tagData.greaterThan = Number(newTagThresholdValue);
        } else if (newTagThresholdType === 'Less than') {
          tagData.lessThan = Number(newTagThresholdValue);
        }
      }
    }
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tagData),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Error creating tag');
        return;
      }
      setTags((prev) => [...prev, data.tag]);
      setNewTagName('');
      setNewTagDescription('');
      setNewTagNotes('');
      setNewTagLinks('');
      if (activeForm === 'Automatic') {
        setNewTagTech('');
        setNewTagMetric('');
        setNewTagMode('Range');
        setNewTagMin('');
        setNewTagMax('');
        setNewTagThresholdType('Greater than');
        setNewTagThresholdValue('');
      }
      setCreateTag(false);
    } catch (error: any) {
      console.error(error);
      setErrorMessage('Internal Server Error');
    }
  };

  const handleCreateFolder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/tags/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName }),
      });
      if (!res.ok) {
        setErrorMessage('Error from server');
        return;
      }
      const data = await res.json();
      setFolders((prev) => [...prev, data.folder]);
      setCreateFolder(false);
    } catch (error: any) {
      console.error(error);
      setErrorMessage('Error creating folder');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tags/folders/${folderId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        setErrorMessage('Error deleting folder');
        return;
      }
      setFolders((prev) => prev.filter((folder) => folder._id !== folderId));
    } catch (error: any) {
      console.error(error);
      setErrorMessage('Error deleting folder');
    } finally {
      setLoading(false);
    }
  };

  const handleDropTag = async (tagId: string, destinationFolderId: string) => {
    try {
      const res = await fetch('/api/tags/folder/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId, folderId: destinationFolderId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error || 'Error saving tag to folder');
        return;
      }
      setFolders((prev) =>
        prev.map((folder) => {
          const updatedTags = folder.tags.filter(
            (id) => id.toString() !== tagId
          );
          if (folder._id === destinationFolderId) {
            return { ...folder, tags: [...updatedTags, tagId] };
          }
          return { ...folder, tags: updatedTags };
        })
      );
    } catch (error: any) {
      console.error(error);
      setErrorMessage('Internal Server Error');
    }
  };

  const handleRemoveTagFromFolder = async (tagId: string) => {
    try {
      const res = await fetch('/api/tags/folder/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error || 'Error removing tag from folder');
        return;
      }
      setFolders((prev) =>
        prev.map((folder) => ({
          ...folder,
          tags: folder.tags.filter((id) => id.toString() !== tagId),
        }))
      );
    } catch (error: any) {
      console.error(error);
      setErrorMessage('Internal Server Error');
    }
  };

  const folderTagIds = new Set<string>();
  folders.forEach((folder) => {
    folder.tags.forEach((id) => folderTagIds.add(id.toString()));
  });
  const standaloneTags = tags.filter(
    (tag) => !folderTagIds.has(tag._id.toString())
  );

  if (loading) return <Loader />;
  if (errorMessage)
    return <ErrorMessage role={role as string} message={errorMessage} />;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex min-h-screen">
        <div className="md:hidden bg-gray-100">
          {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
        </div>
        <div className="hidden md:block w-64 bg-gray-900 text-white">
          {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
        </div>

        <div className="flex-1 p-6 bg-gray-100 flex-col overflow-x-hidden">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex justify-between items-center">
            <h1 className="text-3xl text-gray-900 font-bold">Manage Tags</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setCreateTag(!createTag)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                {createTag ? 'Cancel' : 'Create New Tag'}
              </button>
              <button
                onClick={() => setCreateFolder(!createFolder)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                {createFolder ? 'Cancel' : 'Create New Folder'}
              </button>
            </div>
          </div>

          <div className="space-y-6 mb-6">
            <h1 className="text-gray-800 text-2xl font-bold">Folders</h1>
            {folders.length > 0 &&
              folders.map((folder) => (
                <FolderItem
                  key={folder._id.toString()}
                  folder={folder}
                  tags={tags}
                  openFolder={openFolderIds.includes(folder._id)}
                  onToggleFolder={toggleFolderDetails}
                  onDropTag={handleDropTag}
                  onToggleDetails={toggleTagDetails}
                  onShowDelete={showDeletePopup}
                  onDeleteFolder={handleDeleteFolder}
                  openTagId={openTagId}
                />
              ))}

            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Other Tags
            </h2>
            <OtherTagsContainer
              onDrop={(item: { id: string; sourceFolderId?: string }) => {
                if (item.sourceFolderId) {
                  handleRemoveTagFromFolder(item.id);
                }
              }}
            >
              {standaloneTags.map((tag) => (
                <DraggableTag
                  key={tag._id.toString()}
                  tag={tag}
                  onToggleDetails={toggleTagDetails}
                  onShowDelete={showDeletePopup}
                  isOpen={openTagId === tag._id.toString()}
                />
              ))}
            </OtherTagsContainer>
          </div>

          {createTag && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Create New Tag
              </h2>
              <div className="flex justify-center mb-6">
                <button
                  className={`px-4 py-2 rounded-l-lg ${
                    activeForm === 'Standard'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  } transition`}
                  onClick={() => setActiveForm('Standard')}
                >
                  Standard
                </button>
                <button
                  className={`px-4 py-2 rounded-r-lg ${
                    activeForm === 'Automatic'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  } transition`}
                  onClick={() => setActiveForm('Automatic')}
                >
                  Automatic
                </button>
              </div>
              {activeForm === 'Standard' && (
                <form onSubmit={handleCreateTag} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tag Name
                    </label>
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <input
                      type="text"
                      value={newTagDescription}
                      onChange={(e) => setNewTagDescription(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <textarea
                      value={newTagNotes}
                      onChange={(e) => setNewTagNotes(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Links (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newTagLinks}
                      onChange={(e) => setNewTagLinks(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                  >
                    Save Tag
                  </button>
                </form>
              )}
              {activeForm === 'Automatic' && (
                <form onSubmit={handleCreateTag} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tag Name
                    </label>
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <input
                      type="text"
                      value={newTagDescription}
                      onChange={(e) => setNewTagDescription(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <textarea
                      value={newTagNotes}
                      onChange={(e) => setNewTagNotes(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Links (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newTagLinks}
                      onChange={(e) => setNewTagLinks(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tech
                    </label>
                    <select
                      value={newTagTech}
                      onChange={(e) => setNewTagTech(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      required
                    >
                      <option value="">Select Tech</option>
                      <option value="Blast Motion">Blast Motion</option>
                      <option value="Hittrax">Hittrax</option>
                      <option value="Armcare">Armcare</option>
                      <option value="Trackman">Trackman</option>
                      <option value="Forceplates">Forceplates</option>
                      <option value="Assessments">Assessments</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Metric
                    </label>
                    <select
                      value={newTagMetric}
                      onChange={(e) => setNewTagMetric(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      required
                    >
                      <option value="">Select Metric</option>
                      {newTagTech === 'Blast Motion' ? (
                        <>
                          <option value="onPlaneEfficiency">
                            On Plane Efficiency
                          </option>
                          <option value="attackAngle">Attack Angle</option>
                          <option value="batSpeed">Bat Speed</option>
                          <option value="timeToContact">Time to Contact</option>
                          <option value="earlyConnection">
                            Early Connection
                          </option>
                          <option value="connectionAtImpact">
                            Connection at Impact
                          </option>
                        </>
                      ) : newTagTech === 'Hittrax' ? (
                        <>
                          <option value="velo">Exit Velocity</option>
                          <option value="LA">Launch Angle</option>
                          <option value="dist">Distance</option>
                        </>
                      ) : newTagTech === 'Armcare' ? (
                        <>
                          <option value="armcare_metric1">
                            Armcare Metric 1
                          </option>
                          <option value="armcare_metric2">
                            Armcare Metric 2
                          </option>
                        </>
                      ) : newTagTech === 'Trackman' ? (
                        <>
                          <option value="pitchReleaseSpeed">
                            Pitch Release Speed
                          </option>
                          <option value="spinEfficiency">
                            Spin Efficiency
                          </option>
                          <option value="inducedVerticalBreak">
                            Induced Vertical Break
                          </option>
                          <option value="horizontalBreak">
                            Horizontal Break
                          </option>
                          <option value="spinRate">Spin Rate</option>
                        </>
                      ) : newTagTech === 'Forceplates' ? (
                        <>
                          <option value="forceplates_metric1">
                            Forceplates Metric 1
                          </option>
                          <option value="forceplates_metric2">
                            Forceplates Metric 2
                          </option>
                        </>
                      ) : null}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Mode
                    </label>
                    <select
                      value={newTagMode}
                      onChange={(e) => setNewTagMode(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      required
                    >
                      <option value="Range">Range</option>
                      <option value="Threshold">Threshold</option>
                    </select>
                  </div>
                  {newTagMode === 'Range' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Minimum
                        </label>
                        <input
                          type="number"
                          value={newTagMin}
                          onChange={(e) => setNewTagMin(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Maximum
                        </label>
                        <input
                          type="number"
                          value={newTagMax}
                          onChange={(e) => setNewTagMax(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                          required
                        />
                      </div>
                    </>
                  )}
                  {newTagMode === 'Threshold' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Threshold Type
                        </label>
                        <select
                          value={newTagThresholdType}
                          onChange={(e) =>
                            setNewTagThresholdType(e.target.value)
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                          required
                        >
                          <option value="Greater than">Greater than</option>
                          <option value="Less than">Less than</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Threshold Value
                        </label>
                        <input
                          type="number"
                          value={newTagThresholdValue}
                          onChange={(e) =>
                            setNewTagThresholdValue(e.target.value)
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                          required
                        />
                      </div>
                    </>
                  )}
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                  >
                    Save Tag
                  </button>
                </form>
              )}
            </div>
          )}
          {createFolder && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Create New Folder
              </h2>
              <form onSubmit={handleCreateFolder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Folder Name
                  </label>
                  <input
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                >
                  Save Folder
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deletePopup.show && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded shadow-lg w-80">
              <h3 className="text-lg font-bold mb-4 text-black">
                Confirm Deletion
              </h3>
              <p className="mb-2 text-black">
                Type <strong>DELETE</strong> to confirm deletion.
              </p>
              <input
                type="text"
                placeholder="DELETE"
                value={deletePopup.confirmText}
                onChange={(e) =>
                  setDeletePopup((prev) => ({
                    ...prev,
                    confirmText: e.target.value,
                  }))
                }
                className="border p-2 mb-4 w-full text-black"
              />
              <div className="flex justify-end">
                <button
                  onClick={() =>
                    setDeletePopup({ show: false, tagId: '', confirmText: '' })
                  }
                  className="mr-4 px-4 py-2 border rounded text-black"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (deletePopup.confirmText !== 'DELETE') {
                      alert("Please type 'DELETE' to confirm deletion.");
                      return;
                    }
                    await handleDeleteTag();
                  }}
                  className="px-4 py-2 border rounded bg-red-500 text-white"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default ManageTags;
