import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { communityService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Community } from '../types/index';
import Header from './Header';
import Footer from './Footer';
import { MESSAGES } from '../constants';

interface JoinRequest {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    userType: 'patient' | 'pharmacist';
  };
  community: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface Member {
  _id: string;
  name: string;
  email: string;
}

const CommunityManage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'members'>('requests');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch community data
        const communityResponse = await communityService.getBySlug(slug!);
        
        if (communityResponse.success && communityResponse.data) {
          setCommunity(communityResponse.data);

          // Only proceed with management features if user is authenticated
          if (authUser) {
            // Check if user is the creator of the community
            const creatorId = communityResponse.data.creator._id;
            const userId = authUser._id;
            
            if (!creatorId || !userId) {
              setError('Unable to verify community ownership');
              return;
            }

            // Ensure both IDs are strings before comparison
            const creatorIdStr = String(creatorId).trim();
            const userIdStr = String(userId).trim();

            if (creatorIdStr !== userIdStr) {
              setError('You do not have permission to manage this community');
              return;
            }

            // Fetch join requests for private communities
            if (communityResponse.data.privacy === 'private') {
              const requestsResponse = await communityService.getJoinRequests(communityResponse.data._id);
              if (requestsResponse.success) {
                setJoinRequests(requestsResponse.data || []);
              } else {
                setError(requestsResponse.error || MESSAGES.ERRORS.GENERIC_ERROR);
              }
            }
          } else {
            setError('Please log in to manage this community');
          }
        } else {
          setError('Community not found');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(MESSAGES.ERRORS.GENERIC_ERROR);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, authUser?._id]);

  const handleApproveRequest = async (requestId: string) => {
    try {
      const response = await communityService.approveJoinRequest(requestId);
      if (response.success) {
        setSuccess('Join request approved successfully');
        
        if (!community) {
          setError('Community not found');
          return;
        }
        
        // Refresh both join requests and community data
        const [requestsResponse, communityResponse] = await Promise.all([
          communityService.getJoinRequests(community._id),
          communityService.getBySlug(slug!)
        ]);
        
        if (requestsResponse.success) {
          setJoinRequests(requestsResponse.data || []);
        }
        
        if (communityResponse.success && communityResponse.data) {
          setCommunity(communityResponse.data);
        }
      } else {
        setError(response.error || 'Failed to approve request');
      }
    } catch (err) {
      setError('Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!community) {
      setError('Community not found');
      return;
    }

    const communityId = community._id;

    try {
      const response = await communityService.rejectJoinRequest(requestId);
      if (response.success) {
        setSuccess('Join request rejected successfully');
        
        // Refresh join requests
        const requestsResponse = await communityService.getJoinRequests(communityId);
        if (requestsResponse.success) {
          setJoinRequests(requestsResponse.data || []);
        }
      } else {
        setError(response.error || 'Failed to reject request');
      }
    } catch (err) {
      setError('Failed to reject request');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!community) {
      setError('Community not found');
      return;
    }

    try {
      const response = await communityService.removeMember(community._id, memberId);
      if (response.success) {
        setSuccess('Member removed successfully');
        // Refresh community data
        const communityResponse = await communityService.getBySlug(slug!);
        if (communityResponse.success && communityResponse.data) {
          setCommunity(communityResponse.data);
        }
      } else {
        setError(response.error || 'Failed to remove member');
      }
    } catch (err) {
      setError('Failed to remove member');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <Header user={authUser} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Manage Community</h1>
            <button
              onClick={() => navigate(`/communities/${slug}`)}
              className="text-[#4a6fa5] hover:text-[#3a5a8c] flex items-center gap-2 bg-white px-4 py-2 rounded-md shadow-sm hover:shadow-md transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Community
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`py-4 px-4 border-b-2 font-medium text-sm flex items-center gap-2 rounded-t-lg ${
                    activeTab === 'requests'
                      ? 'border-[#4a6fa5] text-[#4a6fa5] bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 bg-gray-50 hover:bg-white'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  Join Requests
                </button>
                <button
                  onClick={() => setActiveTab('members')}
                  className={`py-4 px-4 border-b-2 font-medium text-sm flex items-center gap-2 rounded-t-lg ${
                    activeTab === 'members'
                      ? 'border-[#4a6fa5] text-[#4a6fa5] bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 bg-gray-50 hover:bg-white'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  Members
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'requests' ? (
                community?.privacy === 'private' ? (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Join Requests</h2>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {joinRequests.length} {joinRequests.length === 1 ? 'request' : 'requests'}
                      </span>
                    </div>
                    {joinRequests.length > 0 ? (
                      <div className="space-y-4">
                        {joinRequests.map((request) => {
                          const isUserMember = community.members.some(
                            (member: any) => member._id === request.user._id
                          );
                          
                          return (
                            <div
                              key={request._id}
                              className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-[#4a6fa5] rounded-full flex items-center justify-center text-white font-medium">
                                    {request.user.name.charAt(0)}
                                  </div>
                                  <div>
                                    <h3 className="font-medium text-gray-900">{request.user.name}</h3>
                                    <p className="text-sm text-gray-500">{request.user.email}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      Requested on {new Date(request.createdAt).toLocaleDateString()}
                                    </p>
                                    {isUserMember && (
                                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        User is already a member of this community
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {!isUserMember && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleApproveRequest(request._id)}
                                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 transition-colors duration-200"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleRejectRequest(request._id)}
                                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 transition-colors duration-200"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                      </svg>
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="mt-4 text-gray-500 text-lg">No pending join requests</p>
                        <p className="text-gray-400 text-sm mt-2">When users request to join, they'll appear here</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="mt-4 text-gray-600 text-lg">This is a public community</p>
                    <p className="text-gray-400 text-sm mt-2">Join requests are only available for private communities</p>
                  </div>
                )
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Community Members</h2>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {community?.members?.length || 0} {community?.members?.length === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                  {community?.members && community.members.length > 0 ? (
                    <div className="space-y-4">
                      {community.members.map((member: Member) => (
                        <div
                          key={member._id}
                          className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-[#4a6fa5] rounded-full flex items-center justify-center text-white font-medium">
                                {member.name.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">{member.name}</h3>
                                <p className="text-sm text-gray-500">{member.email}</p>
                                {member._id === community.creator._id && (
                                  <p className="text-xs text-[#4a6fa5] mt-1 flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                    </svg>
                                    Community Creator
                                  </p>
                                )}
                              </div>
                            </div>
                            {member._id !== community.creator._id && (
                              <button
                                onClick={() => handleRemoveMember(member._id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 transition-colors duration-200"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V7a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="mt-4 text-gray-500 text-lg">No members found</p>
                      <p className="text-gray-400 text-sm mt-2">Members will appear here when they join the community</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CommunityManage; 