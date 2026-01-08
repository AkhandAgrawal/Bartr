import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { userService } from '../services/userService';
import type { UpdateRequest } from '../types/user';
import { FiEdit2, FiSave, FiX, FiUser, FiMail, FiTag, FiPlus, FiCheck, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from 'react-oidc-context';

export const Profile = () => {
  const { user, setUser } = useAuthStore();
  const auth = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState<UpdateRequest>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    gender: user?.gender || '',
    userName: user?.userName || '',
    bio: user?.bio || '',
    email: user?.email || '',
    skillsOffered: user?.skillsOffered?.map((s) => s.skill) || [],
    skillsWanted: user?.skillsWanted?.map((s) => s.skill) || [],
  });
  const [currentSkill, setCurrentSkill] = useState({ offered: '', wanted: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        gender: user.gender || '',
        userName: user.userName || '',
        bio: user.bio || '',
        email: user.email || '',
        skillsOffered: user.skillsOffered?.map((s) => s.skill) || [],
        skillsWanted: user.skillsWanted?.map((s) => s.skill) || [],
      });
    }
  }, [user]);

  const refreshProfile = async () => {
    if (!auth.user?.profile?.sub) return;
    setRefreshing(true);
    try {
      const keycloakId = auth.user.profile.sub;
      const userProfile = await userService.getUserByKeycloakId(keycloakId);
      setUser(userProfile);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addSkill = (type: 'offered' | 'wanted') => {
    const skill = type === 'offered' ? currentSkill.offered : currentSkill.wanted;
    if (skill.trim()) {
      setFormData({
        ...formData,
        [type === 'offered' ? 'skillsOffered' : 'skillsWanted']: [
          ...(formData[type === 'offered' ? 'skillsOffered' : 'skillsWanted'] || []),
          skill.trim(),
        ],
      });
      setCurrentSkill({ ...currentSkill, [type]: '' });
    }
  };

  const removeSkill = (type: 'offered' | 'wanted', index: number) => {
    const skills = formData[type === 'offered' ? 'skillsOffered' : 'skillsWanted'] || [];
    setFormData({
      ...formData,
      [type === 'offered' ? 'skillsOffered' : 'skillsWanted']: skills.filter((_, i) => i !== index),
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const updatedUser = await userService.updateProfile(formData);
      setUser(updatedUser);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
        ></motion.div>
      </div>
    );
  }

  const skillsOffered = user.skillsOffered || [];
  const skillsWanted = user.skillsWanted || [];

  return (
    <div className="max-w-5xl mx-auto pb-8">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        ></motion.div>
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, -60, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
          className="absolute top-40 right-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        ></motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100"
      >
        {/* Gradient header */}
        <div className="relative h-40 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          <div className="absolute bottom-0 left-0 right-0 px-8 pb-6 pt-8 flex justify-between items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-2xl flex items-center justify-center text-4xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white"
            >
              {user.firstName?.[0] || 'U'}
            </motion.div>
            
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={refreshProfile}
                disabled={refreshing}
                className="p-3 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition-colors"
                title="Refresh profile"
              >
                <FiRefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </motion.button>
              
              {!isEditing ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <FiEdit2 className="w-5 h-5" />
                  Edit Profile
                </motion.button>
              ) : (
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        firstName: user.firstName || '',
                        lastName: user.lastName || '',
                        gender: user.gender || '',
                        userName: user.userName || '',
                        bio: user.bio || '',
                        email: user.email || '',
                        skillsOffered: user.skillsOffered?.map((s) => s.skill) || [],
                        skillsWanted: user.skillsWanted?.map((s) => s.skill) || [],
                      });
                    }}
                    className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-white/30 transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full"
                      ></motion.div>
                    ) : (
                      <>
                        <FiSave className="w-5 h-5" />
                        Save
                      </>
                    )}
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 pt-16">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-8">
            {/* Basic Info Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid md:grid-cols-2 gap-6"
            >
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  <FiUser className="w-4 h-4" />
                  First Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="firstName"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                ) : (
                  <p className="text-lg font-medium text-gray-900">{user.firstName}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  <FiUser className="w-4 h-4" />
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="lastName"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                ) : (
                  <p className="text-lg font-medium text-gray-900">{user.lastName}</p>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid md:grid-cols-2 gap-6"
            >
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  <FiTag className="w-4 h-4" />
                  Username
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="userName"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    value={formData.userName}
                    onChange={handleChange}
                  />
                ) : (
                  <p className="text-lg font-medium text-gray-900">@{user.userName}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Gender
                </label>
                {isEditing ? (
                  <select
                    name="gender"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                ) : (
                  <p className="text-lg font-medium text-gray-900">{user.gender}</p>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                <FiMail className="w-4 h-4" />
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  value={formData.email}
                  onChange={handleChange}
                />
              ) : (
                <p className="text-lg font-medium text-gray-900">{user.email}</p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Bio
              </label>
              {isEditing ? (
                <textarea
                  name="bio"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-lg text-gray-700 leading-relaxed">{user.bio || 'No bio yet'}</p>
              )}
            </motion.div>

            {/* Skills Section */}
            {isEditing ? (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-4 p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100"
                >
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    <FiTag className="w-4 h-4" />
                    Skills Offered
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="Add a skill"
                      value={currentSkill.offered}
                      onChange={(e) => setCurrentSkill({ ...currentSkill, offered: e.target.value })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill('offered');
                        }
                      }}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => addSkill('offered')}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                    >
                      <FiPlus className="w-5 h-5" />
                      Add
                    </motion.button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skillsOffered?.map((skill, index) => (
                      <motion.span
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
                      >
                        {skill}
                        <motion.button
                          whileHover={{ scale: 1.2, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => removeSkill('offered', index)}
                          className="hover:text-red-200 transition-colors"
                        >
                          <FiX className="w-4 h-4" />
                        </motion.button>
                      </motion.span>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="space-y-4 p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-100"
                >
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    <FiTag className="w-4 h-4" />
                    Skills Wanted
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                      placeholder="Add a skill"
                      value={currentSkill.wanted}
                      onChange={(e) => setCurrentSkill({ ...currentSkill, wanted: e.target.value })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill('wanted');
                        }
                      }}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => addSkill('wanted')}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                    >
                      <FiPlus className="w-5 h-5" />
                      Add
                    </motion.button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skillsWanted?.map((skill, index) => (
                      <motion.span
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md"
                      >
                        {skill}
                        <motion.button
                          whileHover={{ scale: 1.2, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => removeSkill('wanted', index)}
                          className="hover:text-red-200 transition-colors"
                        >
                          <FiX className="w-4 h-4" />
                        </motion.button>
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-4 p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100"
                >
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      <FiTag className="w-4 h-4" />
                      Skills Offered
                    </label>
                    {skillsOffered.length === 0 && (
                      <button
                        onClick={refreshProfile}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Refresh to load skills
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {skillsOffered.length > 0 ? (
                      skillsOffered.map((skill, index) => (
                        <motion.span
                          key={skill.id || index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.7 + index * 0.05 }}
                          whileHover={{ scale: 1.1, y: -2 }}
                          className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                        >
                          <FiCheck className="w-4 h-4 mr-1" />
                          {skill.skill}
                        </motion.span>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No skills offered yet. Click Edit to add skills.</p>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="space-y-4 p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-100"
                >
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      <FiTag className="w-4 h-4" />
                      Skills Wanted
                    </label>
                    {skillsWanted.length === 0 && (
                      <button
                        onClick={refreshProfile}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Refresh to load skills
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {skillsWanted.length > 0 ? (
                      skillsWanted.map((skill, index) => (
                        <motion.span
                          key={skill.id || index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.8 + index * 0.05 }}
                          whileHover={{ scale: 1.1, y: -2 }}
                          className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                        >
                          <FiCheck className="w-4 h-4 mr-1" />
                          {skill.skill}
                        </motion.span>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No skills wanted yet. Click Edit to add skills.</p>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
