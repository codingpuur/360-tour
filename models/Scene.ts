import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IScene extends Document {
  tourId:      mongoose.Types.ObjectId
  name:        string
  panorama:    string
  preview:     string
  initialView: { lon: number; lat: number; fov: number }
  order:       number
}

const SceneSchema = new Schema<IScene>(
  {
    tourId:   { type: Schema.Types.ObjectId, ref: 'Tour', required: true, index: true },
    name:     { type: String, required: true },
    panorama: { type: String, required: true },
    preview:  { type: String, default: '' },
    initialView: {
      lon: { type: Number, default: 0   },
      lat: { type: Number, default: 0   },
      fov: { type: Number, default: 75  },
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const Scene: Model<IScene> =
  mongoose.models.Scene ?? mongoose.model<IScene>('Scene', SceneSchema)
