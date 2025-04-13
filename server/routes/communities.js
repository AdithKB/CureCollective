const express = require('express');
const router = express.Router();
const Community = require('../models/Community');
const auth = require('../middleware/auth');
const Product = require('../models/Product');

// Create a new community
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, healthConditions, relatedMedications, locations, privacy, guidelines } = req.body;
        
        const community = new Community({
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
        
        community.members.push(req.user._id);
        await community.save();
        
        res.json({
            success: true,
            message: 'Successfully joined community',
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
        
        community.name = name;
        community.description = description;
        community.privacy = privacy;
        community.guidelines = guidelines;
        community.locations = locations;
        community.relatedMedications = relatedMedications;
        
        await community.save();
        
        res.json({
            success: true,
            message: 'Community updated successfully',
            community
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

module.exports = router; 