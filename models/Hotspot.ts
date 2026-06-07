import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IHotspot extends Document {
  sceneId:       mongoose.Types.ObjectId
  type:          'navigation' | 'info'
  position:      { lon: number; lat: number }
  label:         string
  targetSceneId?: mongoose.Types.ObjectId
  targetView?:   { lon: number; lat: number }
  content?: {
    title?: string
    text?:  string
    image?: string
    video?: string
    link?:  string
  }
  icon:   string
  style?: { color?: string; scale?: number }
}

const HotspotSchema = new Schema<IHotspot>(
  {
    sceneId: { type: Schema.Types.ObjectId, ref: 'Scene', required: true, index: true },
    type:    { type: String, enum: ['navigation', 'info'], required: true },
    position: {
      lon: { type: Number, required: true },
      lat: { type: Number, required: true },
    },
    label:         { type: String, default: '' },
    targetSceneId: { type: Schema.Types.ObjectId, ref: 'Scene' },
    targetView:    { lon: Number, lat: Number },
    content: {
      title: String,
      text:  String,
      image: String,
      video: String,
      link:  String,
    },
    icon:  { type: String, default: 'arrow' },
    style: { color: String, scale: Number },
  },
  { timestamps: true }
)

export const Hotspot: Model<IHotspot> =
  mongoose.models.Hotspot ?? mongoose.model<IHotspot>('Hotspot', HotspotSchema)
