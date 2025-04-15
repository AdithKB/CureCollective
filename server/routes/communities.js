const express = require('express');
const router = express.Router();
const Community = require('../models/Community');
const auth = require('../middleware/auth');
const Product = require('../models/Product');
const JoinRequest = require('../models/JoinRequest');

// Function to generate unique community ID
const generateCommunityId = async (name) => {
  const prefix = name.substring(0, 3).toUpperCase();
  const date = new Date();
  const dateStr = `${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
  
  let isUnique = false;
  let communityId;
  
  while (!isUnique) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    communityId = `${prefix}${dateStr}${randomNum}`;
    
    // Check if ID already exists
    const existingCommunity = await Community.findOne({ communityId });
    if (!existingCommunity) {
      isUnique = true;
    }
  }
  
  return communityId;
};

// Create a new community
router.post('/', auth, async (req, res) => {
    try {
        const communityId = await generateCommunityId(req.body.name);
        const { name, description, healthConditions, relatedMedications, locations, privacy, guidelines } = req.body;
        
        const community = new Community({
            communityId,
            name,
            description,
            healthConditions,
            relatedMedications,
            locations,
            privacy,
            guidelines,
            creator: req.user._id,
            members: [req.user._id] // Creator is automatically a member
        });
        
        await community.save();
        
        res.status(201).json({
            success: true,
            message: 'Community created successfully',
            community
        });
    } catch (error) {
        console.error('Community creation error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error creating community',
            error: error.message
        });
    }
});

// Get all communities
router.get('/', async (req, res) => {
    try {
        const communities = await Community.find()
            .populate('creator', 'name')
            .populate('members', 'name')
            .populate('relatedMedications', 'name');
        
        res.json({
            success: true,
            data: communities
        });
    } catch (error) {
        console.error('Error fetching communities:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error fetching communities',
            error: error.message
        });
    }
});

// Get community by ID
router.get('/:id', async (req, res) => {
    try {
        const community = await Community.findById(req.params.id)
            .populate('creator', 'name')
            .populate('members', 'name')
            .populate('relatedMedications', 'name');
        
        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Community not found'
            });
        }
        
        res.json({
            success: true,
            data: community
        });
    } catch (error) {
        console.error('Error fetching community:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error fetching community',
            error: error.message
        });
    }
});

// Get community by slug
router.get('/slug/:slug', async (req, res) => {
    try {
        console.log('Looking for community with slug:', req.params.slug);
        
        // First try to find by ID if the slug looks like an ID
        if (req.params.slug.match(/^[0-9a-fA-F]{24}$/)) {
            console.log('Slug looks like an ID, trying to find by ID');
            const communityById = await Community.findById(req.params.slug)
                .populate('creator', 'name _id')
                .populate('members', 'name _id')
                .populate('relatedMedications', 'name')
                .populate('linkedProducts.product', 'name price bulkPrice minOrderQuantity regularPrice');
            
            if (communityById) {
                console.log('Found community by ID:', communityById.name);
                return res.json({
                    success: true,
                    data: communityById
                });
            }
        }
        
        // Convert the slug to a regex pattern for case-insensitive name matching
        const namePattern = new RegExp(req.params.slug.split('-').join(' '), 'i');
        console.log('Using name pattern:', namePattern);
        
        // First try to find all communities to see what's available
        const allCommunities = await Community.find().select('name');
        console.log('All communities:', allCommunities.map(c => c.name));
        
        const community = await Community.findOne({ name: namePattern })
            .populate('creator', 'name _id')
            .populate('members', 'name _id')
            .populate('relatedMedications', 'name')
            .populate('linkedProducts.product', 'name price bulkPrice minOrderQuantity regularPrice');
        
        console.log('Found community:', community ? community.name : 'none');
        
        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Community not found'
            });
        }
        
        res.json({
            success: true,
            data: community
        });
    } catch (error) {
        console.error('Error fetching community by slug:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error fetching community',
            error: error.message
        });
    }
});

// Join a community
router.post('/:id/join', auth, async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        
        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Community not found'
            });
        }
        
        // Check if user is already a member
        if (community.members.includes(req.user._id)) {
            return res.status(400).json({
                success: false,
                message: 'You are already a member of this community'
            });
        }
        
        // For private communities, create a join request instead of adding directly
        if (community.privacy === 'private') {
            // Check if there's already a pending request
            const existingRequest = await JoinRequest.findOne({
                user: req.user._id,
                community: community._id,
                status: 'pending'
            });
            
            if (existingRequest) {
                return res.status(400).json({
                    success: false,
                    message: 'You already have a pending join request for this community'
                });
            }
            
            // Create new join request
            const joinRequest = new JoinRequest({
                user: req.user._id,
                community: community._id
            });
            
            await joinRequest.save();
            
            return res.json({
                success: true,
                message: 'Join request sent successfully',
                data: joinRequest
            });
        }
        
        // For public communities, add user directly
        community.members.push(req.user._id);
        await community.save();
        
        res.json({
            success: true,
            message: 'Successfully joined the community',
            community
        });
    } catch (error) {
        console.error('Error joining community:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error joining community',
            error: error.message
        });
    }
});

// Leave a community
router.post('/:id/leave', auth, async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        
        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Community not found'
            });
        }
        
        // Check if user is a member
        if (!community.members.includes(req.user._id)) {
            return res.status(400).json({
                success: false,
                message: 'You are not a member of this community'
            });
        }
        
        // Creator cannot leave the community
        if (community.creator.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Community creator cannot leave the community'
            });
        }
        
        community.members = community.members.filter(
            member => member.toString() !== req.user._id.toString()
        );
        
        await community.save();
        
        res.json({
            success: true,
            message: 'Successfully left community',
            community
        });
    } catch (error) {
        console.error('Error leaving community:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error leaving community',
            error: error.message
        });
    }
});

// Delete a community
router.delete('/:id', auth, async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        
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
                message: 'Only the community creator can delete the community'
            });
        }
        
        await community.deleteOne();
        
        res.json({
            success: true,
            message: 'Community deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting community:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error deleting community',
            error: error.message
        });
    }
});

// Update a community
router.put('/:id', auth, async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        
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
                message: 'Only the community creator can update the community'
            });
        }
        
        const { name, description, privacy, guidelines, locations, relatedMedications } = req.body;
        
        // Update the community fields
        const updatedCommunity = await Community.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description,
                privacy,
                guidelines,
                locations,
                relatedMedications,
                $setOnInsert: { communityId: community.communityId } // Preserve the existing communityId
            },
            { new: true, runValidators: true }
        );
        
        res.json({
            success: true,
            message: 'Community updated successfully',
            community: updatedCommunity
        });
    } catch (error) {
        console.error('Error updating community:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error updating community',
            error: error.message
        });
    }
});

router.post('/:communityId/products/:productId', auth, async (req, res) => {
  try {
    const { communityId, productId } = req.params;
    const userId = req.user.id;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user is a member of the community
    if (!community.members.includes(userId)) {
      return res.status(403).json({ error: 'You must be a member of the community to link products' });
    }

    // Check if product is already linked
    if (community.linkedProducts.some(link => link.product.toString() === productId)) {
      return res.status(400).json({ error: 'Product is already linked to this community' });
    }

    community.linkedProducts.push({
      product: productId,
      addedBy: userId
    });

    await community.save();

    res.json({
      success: true,
      data: community
    });
  } catch (error) {
    console.error('Error linking product to community:', error);
    res.status(500).json({ error: 'Failed to link product to community' });
  }
});

router.delete('/:communityId/products/:productId', auth, async (req, res) => {
  try {
    const { communityId, productId } = req.params;
    const userId = req.user.id;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Check if user is a member of the community
    if (!community.members.includes(userId)) {
      return res.status(403).json({ error: 'You must be a member of the community to unlink products' });
    }

    // Remove the product link
    community.linkedProducts = community.linkedProducts.filter(
      link => link.product.toString() !== productId
    );

    await community.save();

    res.json({
      success: true,
      data: community
    });
  } catch (error) {
    console.error('Error unlinking product from community:', error);
    res.status(500).json({ error: 'Failed to unlink product from community' });
  }
});

// Cancel a join request
router.delete('/:id/join-request', auth, async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        
        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Community not found'
            });
        }
        
        // Find and delete the pending join request
        const joinRequest = await JoinRequest.findOne({
            user: req.user._id,
            community: community._id,
            status: 'pending'
        });
        
        if (!joinRequest) {
            return res.status(404).json({
                success: false,
                message: 'No pending join request found'
            });
        }
        
        await joinRequest.deleteOne();
        
        res.json({
            success: true,
            message: 'Join request cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling join request:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error cancelling join request',
            error: error.message
        });
    }
});

// Get user's own join request for a community
router.get('/:id/join-request', auth, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }
    
    // Find the user's join request
    const joinRequest = await JoinRequest.findOne({
      user: req.user._id,
      community: community._id,
      status: 'pending'
    });
    
    res.json({
      success: true,
      data: joinRequest
    });
  } catch (error) {
    console.error('Error fetching join request:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching join request',
      error: error.message
    });
  }
});

// Remove a member from a community
router.delete('/:communityId/members/:memberId', auth, async (req, res) => {
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
        message: 'Only the community creator can remove members'
      });
    }
    
    // Check if member exists
    if (!community.members.includes(req.params.memberId)) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this community'
      });
    }
    
    // Remove member from the community
    community.members = community.members.filter(
      member => member.toString() !== req.params.memberId
    );
    
    await community.save();
    
    res.json({
      success: true,
      message: 'Member removed successfully',
      community
    });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error removing member',
      error: error.message
    });
  }
});

module.exports = router; 