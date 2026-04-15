// server/models/RoadmapCache.js
import mongoose from "mongoose";

const roadmapCacheSchema = new mongoose.Schema({
  // Add a type field to distinguish cache from resources
  type: { type: String, default: 'cache' }, 
  queryVector: { type: [Number], required: true },
  requestKey: { type: String, required: true },
  response: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now, expires: '7d' } 
});

// 🎯 FORCE it to use the 'learningresources' collection
export default mongoose.model("RoadmapCache", roadmapCacheSchema, "learningresources");