import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Camera,
  Eye,
  MessageSquare,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Download,
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
  Trash2,
  AlertTriangle,
  LogOut
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import './AdminPanel.css';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pendingPhotographers, setPendingPhotographers] = useState([]);
  const [photographers, setPhotographers] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  // Safe display helpers for user objects
  const getDisplayName = (user) => {
    if (!user) return 'Unknown User';
    const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return full || user.businessName || user.email || 'Unknown User';
  };

  const getInitial = (user) => {
    const name = getDisplayName(user);
    return typeof name === 'string' && name.length > 0 ? name.charAt(0).toUpperCase() : '?';
  };

  const getProfileImage = (user) => user?.profileImage || user?.profilePicture || null;

  // Fetch data based on active tab
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      switch (activeTab) {
        case 'dashboard':
          await fetchAnalytics();
          break;
        case 'photographers':
          await fetchPhotographers();
          await fetchPendingPhotographers();
          break;
        case 'galleries':
          await fetchGalleries();
          break;
        case 'inquiries':
          await fetchInquiries();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/admin/analytics');
      console.log('Analytics response:', response.data);
      
      // Transform the backend response to match frontend expectations
      const data = response.data.data;
      
      // Calculate total views from top photographers data
      const totalViews = data.topPhotographers?.reduce((sum, photographer) => sum + (photographer.totalViews || 0), 0) || 0;
      
      const transformedAnalytics = {
        totalPhotographers: (data.overview.photographers.pending || 0) + (data.overview.photographers.approved || 0) + (data.overview.photographers.rejected || 0),
        pendingPhotographers: data.overview.photographers.pending || 0,
        approvedPhotographers: data.overview.photographers.approved || 0,
        totalGalleries: (data.overview.galleries.published || 0) + (data.overview.galleries.unpublished || 0),
        publishedGalleries: data.overview.galleries.published || 0,
        totalPhotos: (data.overview.photos.pending || 0) + (data.overview.photos.processing || 0) + (data.overview.photos.completed || 0) + (data.overview.photos.failed || 0),
        totalInquiries: (data.overview.inquiries.new || 0) + (data.overview.inquiries.viewed || 0) + (data.overview.inquiries.responded || 0) + (data.overview.inquiries.completed || 0),
        totalViews: totalViews,
        viewsThisMonth: Math.floor(totalViews * 0.1), // Estimate 10% of total views this month
        newPhotographersThisMonth: data.recentActivity.signups || 0,
        newGalleriesThisMonth: data.recentActivity.galleries || 0,
        newPhotosThisMonth: data.recentActivity.photos || 0,
        newInquiriesThisMonth: data.recentActivity.inquiries || 0,
        topPhotographers: data.topPhotographers || []
      };
      
      setAnalytics(transformedAnalytics);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const fetchPendingPhotographers = async () => {
    try {
      const response = await axios.get('/admin/pending');
      console.log('Pending photographers data:', response.data);
      setPendingPhotographers(response.data.data?.users || []);
    } catch (error) {
      console.error('Error fetching pending photographers:', error);
    }
  };

  const fetchPhotographers = async () => {
    try {
      const response = await axios.get('/admin/photographers');
      console.log('Photographers data:', response.data);
      setPhotographers(response.data.data?.photographers || []);
    } catch (error) {
      console.error('Error fetching photographers:', error);
    }
  };

  const fetchGalleries = async () => {
    try {
      const response = await axios.get('/admin/galleries');
      setGalleries(response.data.data?.galleries || []);
    } catch (error) {
      console.error('Error fetching galleries:', error);
    }
  };

  const fetchInquiries = async () => {
    try {
      const response = await axios.get('/admin/inquiries');
      setInquiries(response.data.data?.inquiries || []);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    }
  };

  // Handle photographer approval/rejection
  const handlePhotographerAction = async (photographerId, action) => {
    try {
      await axios.post(`/admin/${action}/${photographerId}`);
      toast.success(`Photographer ${action}d successfully`);
      await fetchPendingPhotographers();
      await fetchPhotographers();
    } catch (error) {
      console.error(`Error ${action}ing photographer:`, error);
      toast.error(`Failed to ${action} photographer`);
    }
  };

  // Handle gallery actions
  const handleGalleryAction = async (galleryId, action) => {
    try {
      if (action === 'unpublish') {
        await axios.patch(`/admin/galleries/${galleryId}/status`, {
          isPublished: false
        });
        toast.success('Gallery unpublished successfully');
      } else if (action === 'publish') {
        await axios.patch(`/admin/galleries/${galleryId}/status`, {
          isPublished: true
        });
        toast.success('Gallery published successfully');
      } else if (action === 'delete') {
        await axios.delete(`/admin/galleries/${galleryId}`);
        toast.success('Gallery deleted successfully');
      } else {
        throw new Error(`Unsupported action: ${action}`);
      }
      await fetchGalleries();
    } catch (error) {
      console.error(`Error ${action}ing gallery:`, error);
      toast.error(`Failed to ${action} gallery`);
    }
  };

  // Filter and search functions
  const filterData = (data, type) => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => {
        const searchFields = type === 'photographers' 
          ? [item.name, item.email, item.specialties?.join(' ')]
          : type === 'galleries'
          ? [item.title, item.description, item.photographer?.name]
          : [item.clientName, item.clientEmail, item.message];
        
        return searchFields.some(field => 
          field?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => {
        if (type === 'photographers') {
          return (item.status || '').toLowerCase() === filterStatus.toLowerCase();
        } else if (type === 'galleries') {
          return filterStatus === 'published' ? item.isPublished : !item.isPublished;
        } else {
          return (item.status || '').toLowerCase() === filterStatus.toLowerCase();
        }
      });
    }

    return filtered;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Confirm action modal
  const showConfirmation = (action, item) => {
    setConfirmAction({ action, item });
    setShowConfirmModal(true);
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    
    const { action, item } = confirmAction;
    
    if (action.includes('photographer')) {
      await handlePhotographerAction(item._id, action.split('-')[1]);
    } else if (action.includes('gallery')) {
      await handleGalleryAction(item._id, action.split('-')[1]);
    }
    
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  // Render dashboard
  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h2>Platform Analytics</h2>
        <button className="export-button">
          <Download className="icon" />
          Export Report
        </button>
      </div>

      {analytics && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon users">
                <Users />
              </div>
              <div className="stat-content">
                <h3>{analytics.totalPhotographers}</h3>
                <p>Total Photographers</p>
                <span className="stat-change positive">
                  +{analytics.newPhotographersThisMonth} this month
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon galleries">
                <Camera />
              </div>
              <div className="stat-content">
                <h3>{analytics.totalGalleries}</h3>
                <p>Total Galleries</p>
                <span className="stat-change positive">
                  +{analytics.newGalleriesThisMonth} this month
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon views">
                <Eye />
              </div>
              <div className="stat-content">
                <h3>{analytics.totalViews?.toLocaleString()}</h3>
                <p>Total Views</p>
                <span className="stat-change positive">
                  +{analytics.viewsThisMonth?.toLocaleString()} this month
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon inquiries">
                <MessageSquare />
              </div>
              <div className="stat-content">
                <h3>{analytics.totalInquiries}</h3>
                <p>Total Inquiries</p>
                <span className="stat-change positive">
                  +{analytics.newInquiriesThisMonth} this month
                </span>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3>Monthly Growth</h3>
              <div className="chart-placeholder">
                <BarChart3 className="chart-icon" />
                <p>Chart visualization would go here</p>
              </div>
            </div>

            <div className="chart-card">
              <h3>User Distribution</h3>
              <div className="chart-placeholder">
                <PieChart className="chart-icon" />
                <p>Chart visualization would go here</p>
              </div>
            </div>
          </div>

          <div className="recent-activity">
            <h3>Recent Activity</h3>
            <div className="activity-list">
              {analytics.recentActivity?.map((activity, index) => (
                <div key={index} className="activity-item">
                  <Activity className="activity-icon" />
                  <div className="activity-content">
                    <p>{activity.description}</p>
                    <span className="activity-time">{formatDate(activity.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Render photographers tab
  const renderPhotographers = () => {
    const filteredPending = filterData(pendingPhotographers, 'photographers');
    const filteredApproved = filterData(photographers, 'photographers');

    return (
      <div className="photographers-content">
        <div className="content-header">
          <h2>Photographer Management</h2>
          <div className="header-actions">
            <div className="search-box">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search photographers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Pending Approvals */}
        {filteredPending.length > 0 && (
          <div className="section">
            <h3 className="section-title">
              <Clock className="section-icon" />
              Pending Approvals ({filteredPending.length})
            </h3>
            <div className="photographers-grid">
              {filteredPending.map((photographer) => (
                <motion.div
                  key={photographer._id}
                  className="photographer-card pending"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="photographer-header">
                    <div className="photographer-avatar">
                      {getProfileImage(photographer) ? (
                        <img src={getProfileImage(photographer)} alt={getDisplayName(photographer)} />
                      ) : (
                        <div className="avatar-placeholder">
                          {getInitial(photographer)}
                        </div>
                      )}
                    </div>
                    <div className="photographer-info">
                      <h4>{getDisplayName(photographer)}</h4>
                      <p className="photographer-email">{photographer.email}</p>
                      <span className="status-badge pending">Pending</span>
                    </div>
                  </div>

                  <div className="photographer-details">
                    {photographer.phone && (
                      <div className="detail-item">
                        <Phone className="detail-icon" />
                        <span>{photographer.phone}</span>
                      </div>
                    )}
                    {photographer.location && (
                      <div className="detail-item">
                        <MapPin className="detail-icon" />
                        <span>{photographer.location}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <Calendar className="detail-icon" />
                      <span>Applied {formatDate(photographer.createdAt)}</span>
                    </div>
                  </div>

                  {photographer.bio && (
                    <div className="photographer-bio">
                      <p>{photographer.bio}</p>
                    </div>
                  )}

                  {photographer.specialties && photographer.specialties.length > 0 && (
                    <div className="photographer-specialties">
                      {photographer.specialties.map((specialty, index) => (
                        <span key={index} className="specialty-tag">{specialty}</span>
                      ))}
                    </div>
                  )}

                  <div className="photographer-actions">
                    <button
                      className="action-button approve"
                      onClick={() => showConfirmation('photographer-approve', photographer)}
                    >
                      <CheckCircle className="action-icon" />
                      Approve
                    </button>
                    <button
                      className="action-button reject"
                      onClick={() => showConfirmation('photographer-reject', photographer)}
                    >
                      <XCircle className="action-icon" />
                      Reject
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Photographers */}
        {filteredApproved.length > 0 && (
          <div className="section">
            <h3 className="section-title">
              <CheckCircle className="section-icon" />
              Approved Photographers ({filteredApproved.length})
            </h3>
            <div className="photographers-table">
              <table>
                <thead>
                  <tr>
                    <th>Photographer</th>
                    <th>Email</th>
                    <th>Galleries</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApproved.map((photographer) => (
                    <tr key={photographer._id}>
                      <td>
                        <div className="table-photographer">
                          <div className="photographer-avatar small">
                            {getProfileImage(photographer) ? (
                              <img src={getProfileImage(photographer)} alt={getDisplayName(photographer)} />
                            ) : (
                              <div className="avatar-placeholder">
                                {getInitial(photographer)}
                              </div>
                            )}
                          </div>
                          <span>{getDisplayName(photographer)}</span>
                        </div>
                      </td>
                      <td>{photographer.email}</td>
                      <td>{photographer.galleryCount || 0}</td>
                      <td>
                        <span className={`status-badge ${photographer.status}`}>
                          {photographer.status}
                        </span>
                      </td>
                      <td>{formatDate(photographer.createdAt)}</td>
                      <td>
                        <div className="table-actions">
                          <button className="action-button small">
                            <ExternalLink className="action-icon" />
                          </button>
                          <button className="action-button small">
                            <MoreVertical className="action-icon" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render galleries tab
  const renderGalleries = () => {
    const filteredGalleries = filterData(galleries, 'galleries');

    return (
      <div className="galleries-content">
        <div className="content-header">
          <h2>Gallery Management</h2>
          <div className="header-actions">
            <div className="search-box">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search galleries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Galleries</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </div>
        </div>

        <div className="galleries-grid">
          {filteredGalleries.map((gallery) => (
            <motion.div
              key={gallery._id}
              className="gallery-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="gallery-image">
                {gallery.coverImage ? (
                  <img src={gallery.coverImage} alt={gallery.title} />
                ) : (
                  <div className="image-placeholder">
                    <Camera className="placeholder-icon" />
                  </div>
                )}
                <div className="gallery-overlay">
                  <span className={`status-badge ${gallery.isPublished ? 'published' : 'unpublished'}`}>
                    {gallery.isPublished ? 'Published' : 'Unpublished'}
                  </span>
                </div>
              </div>

              <div className="gallery-content">
                <h4>{gallery.title}</h4>
                <p className="gallery-photographer">by {gallery.photographer?.name}</p>
                <p className="gallery-description">{gallery.description}</p>
                
                <div className="gallery-stats">
                  <div className="stat">
                    <Eye className="stat-icon" />
                    <span>{gallery.views || 0} views</span>
                  </div>
                  <div className="stat">
                    <Camera className="stat-icon" />
                    <span>{gallery.photoCount || 0} photos</span>
                  </div>
                </div>

                <div className="gallery-actions">
                  <button className="action-button small">
                    <ExternalLink className="action-icon" />
                    View
                  </button>
                  {gallery.isPublished ? (
                    <button
                      className="action-button small warning"
                      onClick={() => showConfirmation('gallery-unpublish', gallery)}
                    >
                      <XCircle className="action-icon" />
                      Unpublish
                    </button>
                  ) : (
                    <button
                      className="action-button small success"
                      onClick={() => showConfirmation('gallery-publish', gallery)}
                    >
                      <CheckCircle className="action-icon" />
                      Publish
                    </button>
                  )}
                  <button
                    className="action-button small danger"
                    onClick={() => showConfirmation('gallery-delete', gallery)}
                  >
                    <Trash2 className="action-icon" />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  // Render inquiries tab
  const renderInquiries = () => {
    const filteredInquiries = filterData(inquiries, 'inquiries');

    return (
      <div className="inquiries-content">
        <div className="content-header">
          <h2>Client Inquiries</h2>
          <div className="header-actions">
            <div className="search-box">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search inquiries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="responded">Responded</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="inquiries-list">
          {filteredInquiries.map((inquiry) => (
            <motion.div
              key={inquiry._id}
              className="inquiry-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="inquiry-header">
                <div className="inquiry-info">
                  <h4>{inquiry.clientName}</h4>
                  <p className="inquiry-email">{inquiry.clientEmail}</p>
                  <span className={`status-badge ${inquiry.status}`}>
                    {inquiry.status}
                  </span>
                </div>
                <div className="inquiry-meta">
                  <span className="inquiry-date">{formatDate(inquiry.createdAt)}</span>
                  {inquiry.gallery && (
                    <span className="inquiry-gallery">Re: {inquiry.gallery.title}</span>
                  )}
                </div>
              </div>

              <div className="inquiry-content">
                <p>{inquiry.message}</p>
              </div>

              {inquiry.phone && (
                <div className="inquiry-contact">
                  <Phone className="contact-icon" />
                  <span>{inquiry.phone}</span>
                </div>
              )}

              <div className="inquiry-actions">
                <button className="action-button small">
                  <Mail className="action-icon" />
                  Respond
                </button>
                <button className="action-button small">
                  <MoreVertical className="action-icon" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="admin-panel">
      {/* Sidebar Navigation */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart3 className="nav-icon" />
            Dashboard
          </button>
          
          <button
            className={`nav-item ${activeTab === 'photographers' ? 'active' : ''}`}
            onClick={() => setActiveTab('photographers')}
          >
            <Users className="nav-icon" />
            Photographers
            {pendingPhotographers.length > 0 && (
              <span className="nav-badge">{pendingPhotographers.length}</span>
            )}
          </button>
          
          <button
            className={`nav-item ${activeTab === 'galleries' ? 'active' : ''}`}
            onClick={() => setActiveTab('galleries')}
          >
            <Camera className="nav-icon" />
            Galleries
          </button>
          
          <button
            className={`nav-item ${activeTab === 'inquiries' ? 'active' : ''}`}
            onClick={() => setActiveTab('inquiries')}
          >
            <MessageSquare className="nav-icon" />
            Inquiries
          </button>

          {/* Sign Out */}
          <button
            className="nav-item"
            onClick={handleLogout}
          >
            <LogOut className="nav-icon" />
            Sign Out
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'photographers' && renderPhotographers()}
            {activeTab === 'galleries' && renderGalleries()}
            {activeTab === 'inquiries' && renderInquiries()}
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && confirmAction && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="confirm-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="modal-header">
                <AlertTriangle className="warning-icon" />
                <h3>Confirm Action</h3>
              </div>
              
              <div className="modal-content">
                <p>
                  Are you sure you want to {confirmAction.action.split('-')[1]} 
                  {confirmAction.action.includes('photographer') ? 'this photographer' : 'this gallery'}?
                </p>
                {confirmAction.item.name && (
                  <p className="item-name">{confirmAction.item.name}</p>
                )}
                {confirmAction.item.title && (
                  <p className="item-name">{confirmAction.item.title}</p>
                )}
              </div>
              
              <div className="modal-actions">
                <button
                  className="action-button secondary"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="action-button primary"
                  onClick={executeConfirmedAction}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;