const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Community = require('../models/Community');
const JoinRequest = require('../models/JoinRequest');

// Get join requests for a community
router.get('/communities/:communityId/join-requests', auth, async (req, res) => {
  try {
    const community = await Community.findById(req.params.communityId);
    
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }
    
    // Check if user is the creator
    if (community.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the community creator can view join requests'
      });
    }
    
    const joinRequests = await JoinRequest.find({ community: req.params.communityId, status: 'pending' })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: joinRequests
    });
  } catch (error) {
    console.error('Error fetching join requests:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching join requests',
      error: error.message
    });
  }
});

// Approve a join request
router.post('/communities/join-requests/:requestId/approve', auth, async (req, res) => {
  try {
    const joinRequest = await JoinRequest.findById(req.params.requestId)
      .populate('community');
    
    if (!joinRequest) {
      return res.status(404).json({
        success: false,
        message: 'Join request not found'
      });
    }
    
    const community = joinRequest.community;
    
    // Check if user is the creator
    if (community.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the community creator can approve join requests'
      });
    }
    
    // Add user to community members
    if (!community.members.includes(joinRequest.user)) {
      community.members.push(joinRequest.user);
      await community.save();
    }
    
    // Update join request status using findOneAndUpdate with upsert
    const updatedRequest = await JoinRequest.findOneAndUpdate(
      { 
        user: joinRequest.user,
        community: joinRequest.community,
        status: { $in: ['pending', 'rejected'] }
      },
      { 
        $set: { 
          status: 'approved',
          updatedAt: Date.now()
        }
      },
      { 
        new: true,
        upsert: true
      }
    );
    
    res.json({
      success: true,
      message: 'Join request approved successfully',
      data: updatedRequest
    });
  } catch (error) {
    console.error('Error approving join request:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error approving join request',
      error: error.message
    });
  }
});

// Reject a join request
router.post('/communities/join-requests/:requestId/reject', auth, async (req, res) => {
  try {
    const joinRequest = await JoinRequest.findById(req.params.requestId)
      .populate('community');
    
    if (!joinRequest) {
      return res.status(404).json({
        success: false,
        message: 'Join request not found'
      });
    }
    
    const community = joinRequest.community;
    
    // Check if user is the creator
    if (community.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the community creator can reject join requests'
      });
    }
    
    // Update join request status using findOneAndUpdate with upsert
    const updatedRequest = await JoinRequest.findOneAndUpdate(
      { 
        user: joinRequest.user,
        community: joinRequest.community,
        status: { $in: ['pending', 'approved'] }
      },
      { 
        $set: { 
          status: 'rejected',
          updatedAt: Date.now()
        }
      },
      { 
        new: true,
        upsert: true
      }
    );
    
    res.json({
      success: true,
      message: 'Join request rejected successfully',
      data: updatedRequest
    });
  } catch (error) {
    console.error('Error rejecting join request:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error rejecting join request',
      error: error.message
    });
  }
});

module.exports = router; 