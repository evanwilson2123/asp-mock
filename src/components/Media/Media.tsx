// 'use client';
// import { useUser } from '@clerk/nextjs';
// import { useParams } from 'next/navigation';
// import React, { useEffect, useState } from 'react';

// const Media = () => {
//   // handle the state for loading and error states
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   // handle the state for if the user is uploading media
//   const [isUploadMedia, setIsUploadMedia] = useState<boolean>(false);
//   const [mediaType, setMediaType] = useState<string>('');
//   // handle the state for the media itself (interfaces TBD)
//   const [videos, setVideos] = useState<any>(null);
//   const [images, setImages] = useState<any>(null);
//   // get the role, userId, and mount the router
//   const { user } = useUser();
//   const role = user?.publicMetadata?.role;
//   // get the athleteId from the url params
//   const { athleteId } = useParams();

//   useEffect(() => {
//     const fetchMedia = async () => {
//       try {
//         const res = await fetch(`/api/athlete/${athleteId}/media`);
//         const data = await res.json();
//         if (!res.ok) {
//           setError(
//             res.status === 404
//               ? 'Could not find data for this athlete'
//               : res.status === 400
//                 ? 'Bad Request'
//                 : 'Internal Server Error'
//           );
//           return;
//         }
//         setVideos(data.videos);
//         setImages(data.images);
//       } catch (error: any) {
//         console.error(error);
//         setError(error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchMedia();
//   }, [athleteId]);

//   const handleUploadMedia = async () => {};
//   return (
//     <div>
//       <h1>MEDIA PAGE</h1>
//     </div>
//   );
// };

// export default Media;
