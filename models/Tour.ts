import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ITour extends Document {
  slug:        string
  title:       string
  description: string
  coverImage:  string
  startSceneId: mongoose.Types.ObjectId
  floorplan?: {
    image:   string
    markers: Array<{ sceneId: mongoose.Types.ObjectId; x: number; y: number }>
  }
  isPublished: boolean
  settings: {
    autoRotate:  boolean
    showCompass: boolean
    allowEmbed:  boolean
  }
  createdAt: Date
  updatedAt: Date
}

const TourSchema = new Schema<ITour>(
  {
    slug:        { type: String, required: true, unique: true, index: true },
    title:       { type: String, required: true },
    description: { type: String, default: '' },
    coverImage:  { type: String, default: '' },
    startSceneId:{ type: Schema.Types.ObjectId, ref: 'Scene' },
    floorplan: {
      image:   String,
      markers: [
        {
          sceneId: { type: Schema.Types.ObjectId, ref: 'Scene' },
          x: Number,
          y: Number,
        },
      ],
    },
    isPublished: { type: Boolean, default: false },
    settings: {
      autoRotate:  { type: Boolean, default: false },
      showCompass: { type: Boolean, default: true  },
      allowEmbed:  { type: Boolean, default: true  },
    },
  },
  { timestamps: true }
)

export const Tour: Model<ITour> =
  mongoose.models.Tour ?? mongoose.model<ITour>('Tour', TourSchema)
